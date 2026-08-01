// Super Agent Party Service Worker
// 缓存策略（与 server.py 的静态资源版本号注入配套）：
//   - HTML 主文档: network-first + Cache-Control: no-cache（每次都重新校验，保证拿到最新）
//   - 带 ?v=<hash> 的资源: cache-first（内容寻址，hash 不变即内容没变，永不 revalidate）
//   - 不带版本号懒加载的库: stale-while-revalidate（兼容特殊动态加载）
// 注意: 升级缓存策略/缓存结构时必须递增 CACHE_NAME，否则旧缓存不会被清理。
const CACHE_NAME = 'sap-cache-v2';

// 带内容版本号(?v=)的静态资源
const VERSIONED_ASSET_RE = /\.(?:css|js|png|jpe?g|svg|gif|webp|ico|woff2?|ttf|eot|mp4|webm)\?v=/;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 依据最新 HTML 里引用的版本号，清理缓存中已过期的同名资源旧版本，防止缓存无限增长
function pruneStaleVersionedAssets(htmlText) {
  const current = new Set();
  const re = /(?:src|href)="([^"]+\?v=[a-f0-9]+)"/g;
  let m;
  while ((m = re.exec(htmlText))) {
    const url = m[1];
    if (!url || url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) continue;
    current.add(new URL(url, self.location.origin).href);
  }
  return caches.open(CACHE_NAME).then(cache => cache.keys()).then(keys =>
    Promise.all(
      keys
        .filter(req => {
          const u = new URL(req.url);
          if (!VERSIONED_ASSET_RE.test(u.pathname + u.search)) return false;
          // 该资源在当前页面被引用，但缓存中的版本号不是最新 → 删除旧版本
          const isReferenced = [...current].some(c => new URL(c).pathname === u.pathname);
          return isReferenced && !current.has(req.url);
        })
        .map(req => cache.delete(req))
    )
  );
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 仅对同源请求应用 SW 缓存策略
  if (url.origin !== self.location.origin) return;

  const isHTML = (req.destination === 'document') || url.pathname.endsWith('.html') || url.pathname === '/';
  const isStaticAsset = /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/.test(url.pathname);

  if (isHTML) {
    // network-first：保证主文档及时更新，并在后台清理过期资源
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const cacheCopy = res.clone();
          const textCopy = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, cacheCopy).catch(() => {});
            return textCopy.text().then(pruneStaleVersionedAssets).catch(() => {});
          }).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req).then(r => r || Response.error()))
    );
    return;
  }

  if (isStaticAsset) {
    const versioned = url.searchParams.has('v');
    if (versioned) {
      // 内容寻址资源：缓存优先，永不 revalidate
      event.respondWith(
        caches.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
          }).catch(() => Response.error());
        })
      );
    } else {
      // 非版本化懒加载库：stale-while-revalidate
      event.respondWith(
        caches.match(req).then(cached => {
          const network = fetch(req).then(res => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      );
    }
    return;
  }
});
