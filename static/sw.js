// Super Agent Party Service Worker
// 缓存关键静态资源，第二次启动时主页面与 CSS 走 SW 缓存秒开
const CACHE_NAME = 'sap-cache-v1';

// 关键渲染资源（首次安装时预缓存）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/transition.css',
  '/libs/element-plus.css',
  '/fontawesome/css/all.min.css',
  '/css/github-markdown.min.css',
  '/css/github.min.css',
  '/libs/driver.css',
  '/libs/katex.min.css',
  '/source/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        // 单个资源失败不应阻塞整个 install
        console.warn('[SW] precache partial fail:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 缓存策略：CSS/JS/图片等静态资源用 stale-while-revalidate；
// HTML 主文档用 network-first（保证更新及时）
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 仅对同源请求应用 SW 缓存策略
  if (url.origin !== self.location.origin) return;

  const isHTML = (req.destination === 'document') || url.pathname.endsWith('.html') || url.pathname === '/';
  const isStaticAsset = /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/.test(url.pathname);

  if (isHTML) {
    // network-first：保证主文档及时更新
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || Response.error()))
    );
    return;
  }

  if (isStaticAsset) {
    // stale-while-revalidate：先返回缓存，后台再异步更新
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
    return;
  }
});
