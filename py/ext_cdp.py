"""外部应用 CDP 工具——完全独立，不污染内置浏览器工具"""
import json
import asyncio

EXTERNAL_CDP_PORT = 0
EXTERNAL_CDP_WS_URL = None


def _is_external():
    return EXTERNAL_CDP_PORT > 0


async def _ext_cmd(method, params=None):
    global EXTERNAL_CDP_PORT
    from py.local_app_control import get_connected_ports, execute_external_cdp
    if EXTERNAL_CDP_PORT <= 0:
        ports = get_connected_ports()
        if ports:
            EXTERNAL_CDP_PORT = ports[0]
        else:
            return {"error": "没有已连接的外部应用，请先用 ext_list_apps 查看并 ext_select_app 选择", "success": False}
    result = await execute_external_cdp(EXTERNAL_CDP_PORT, method, params)
    return result


async def ext_click(uid, dblClick=False):
    script = f"""
    (() => {{
        const el = document.querySelector('[data-ai-id="{uid}"]');
        if (!el) return JSON.stringify({{error: 'not found: {uid}'}});
        const isClickable = el.matches('button, a, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [onclick], details, summary');
        if (!isClickable) return JSON.stringify({{error: 'not clickable', tag: el.tagName, role: el.getAttribute('role')||''}});
        el.scrollIntoView({{behavior:'instant', block:'center'}});
        const r = el.getBoundingClientRect();
        return JSON.stringify({{x: r.left+r.width/2, y: r.top+r.height/2, tag: el.tagName}});
    }})()
    """
    r = await _ext_cmd("Runtime.evaluate", {"expression": script, "returnByValue": True})
    if "error" in r:
        return f"点击失败: {r['error']}"
    raw = r.get("result", {}).get("value", "")
    if isinstance(raw, str) and raw.startswith("{"):
        d = json.loads(raw)
        if "error" in d:
            if "not clickable" in d["error"]:
                return f"元素 {d.get('role') or d.get('tag')} 可能不可交互，请用 click_by_text 重试"
            return d["error"]
    else:
        return f"Click error: {raw}"

    d = json.loads(raw)
    x, y = d["x"], d["y"]
    for _ in range(2 if dblClick else 1):
        await _ext_cmd("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y, "pointerType": "mouse"})
        await asyncio.sleep(0.02)
        await _ext_cmd("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x, "y": y, "button": "left", "clickCount": 1, "pointerType": "mouse"})
        await asyncio.sleep(0.05)
        await _ext_cmd("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x, "y": y, "button": "left", "clickCount": 1, "pointerType": "mouse"})
    await _ext_cmd("Runtime.evaluate", {"expression": f"document.querySelector('[data-ai-id=\"{uid}\"]')?.focus(); document.querySelector('[data-ai-id=\"{uid}\"]')?.click(); 'ok'", "returnByValue": True})
    return f"clicked {d['tag']}"


async def ext_fill(uid, value):
    script = f"""
    (() => {{
        const el = document.querySelector('[data-ai-id="{uid}"]');
        if (!el) return 'Element not found: {uid}';
        el.focus();
        const ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set
                || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')?.set;
        if (ns) ns.call(el, {json.dumps(value)});
        else el.value = {json.dumps(value)};
        el.dispatchEvent(new Event('input',{{bubbles:true}}));
        el.dispatchEvent(new Event('change',{{bubbles:true}}));
        return 'filled '+el.tagName;
    }})()
    """
    r = await _ext_cmd("Runtime.evaluate", {"expression": script, "returnByValue": True})
    if "error" in r:
        return f"填充失败: {r['error']}"
    v = r.get("result", {}).get("value", str(r))
    return v


async def ext_screenshot():
    r = await _ext_cmd("Page.captureScreenshot", {"format": "png"})
    if not r.get("success", True):
        return f"截图失败: {r.get('error', '未知错误')}"
    data = r.get("data", "")
    if not data:
        return f"截图失败: CDP 返回空数据 (可能该应用不支持截图)"
    import base64, os, time
    from py.get_setting import UPLOAD_FILES_DIR, get_port
    img_bytes = base64.b64decode(data)
    filename = f"screenshot_ext_{int(time.time())}.png"
    filepath = os.path.join(UPLOAD_FILES_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(img_bytes)
    port = get_port()
    return f"[Getting browser screenshot] http://127.0.0.1:{port}/uploaded_files/{filename}"


async def ext_snapshot():
    script = """
(function() {
    if (!window._ai_uid_counter) window._ai_uid_counter = 1;
    const isel = 'a, button, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [onclick], [tabindex]:not([tabindex="-1"]), [data-action], [data-click]';
    function isVisible(el) {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && el.offsetWidth > 0;
    }
    function getSafeText(el) {
        const aria = el.getAttribute('aria-label');
        if (aria) return aria.slice(0, 60);
        const title = el.getAttribute('title');
        const t = el.tagName;
        if (t === 'INPUT' || t === 'TEXTAREA') return el.value || el.getAttribute('placeholder') || el.name || title || '';
        if (t === 'SELECT') return el.options[el.selectedIndex]?.text || '';
        if (t === 'IMG') return el.alt || title || '';
        if (!el.childNodes.length && title) return title.slice(0, 60);
        const txt = el.innerText || el.textContent || title || '';
        for (const c of el.children) {
            const ca = c.getAttribute('aria-label');
            if (ca) return ca.slice(0, 60);
            const ct = c.getAttribute('title');
            if (ct) return ct.slice(0, 60);
        }
        return txt.slice(0, 60).replace(/\\s+/g, ' ').trim();
    }
    const elements = document.querySelectorAll(isel);
    const lines = [];
    elements.forEach(el => {
        if (!isVisible(el)) return;
        let uid = el.getAttribute('data-ai-id');
        if (!uid) { uid = 'ai-' + (window._ai_uid_counter++); el.setAttribute('data-ai-id', uid); }
        const role = el.getAttribute('role');
        const tag = el.tagName.toLowerCase();
        const displayTag = role || tag;
        const name = getSafeText(el);
        const val = (el.value && el.value !== name) ? ' Value: "' + el.value.slice(0, 40) + '"' : '';
        lines.push('[' + uid + '] ' + displayTag + (name ? ' "' + name + '"' : '') + val);
    });
    if (lines.length === 0) return 'No interactive elements. Page: ' + (document.body?.innerText?.slice(0,500)||'');
    return lines.join('\\n');
})()
"""
    r = await _ext_cmd("Runtime.evaluate", {"expression": script, "returnByValue": True})
    if "error" in r:
        return f"快照失败: {r['error']}"
    v = r.get("result", {}).get("value", str(r))
    return v


async def ext_evaluate_script(script_code, args=None):
    code = script_code.strip().strip('`')
    if code.startswith('javascript'):
        code = code[10:].strip()
    if code.startswith("function") or code.startswith("() =>") or code.startswith("async function"):
        code = f"({code})()"
    r = await _ext_cmd("Runtime.evaluate", {"expression": code, "returnByValue": True, "awaitPromise": True})
    if "error" in r:
        return f"执行失败: {r['error']}"
    if r.get("result", {}).get("type") == "string":
        return r["result"]["value"]
    if "value" in r.get("result", {}):
        v = r["result"]["value"]
        return v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    if "exceptionDetails" in r:
        return f"JS Exception: {r['exceptionDetails'].get('text','')}"
    return json.dumps(r.get("result", {}), indent=2, ensure_ascii=False)


async def ext_hover(uid):
    return await _ext_cmd("Runtime.evaluate", {
        "expression": f"document.querySelector('[data-ai-id=\"{uid}\"]')?.dispatchEvent(new MouseEvent('mouseover',{{bubbles:true}}))||'ok'",
        "returnByValue": True
    })


async def ext_press_key(key, uid=None):
    return await _ext_cmd("Input.dispatchKeyEvent", {"type": "keyDown", "key": key})


async def ext_wait_for(text, timeout=1000):
    script = f"""
    (() => {{ const s=Date.now(); while(!(document.body?.innerText||'').includes({json.dumps(text)})){{ if(Date.now()-s>{timeout})return'timeout'; }} return'found'; }})()
    """
    r = await _ext_cmd("Runtime.evaluate", {"expression": script, "returnByValue": True})
    return r.get("result", {}).get("value", str(r))


async def ext_list_apps():
    from py.local_app_control import get_all_connection_info
    info = get_all_connection_info()
    for app in info:
        app["targets"] = [{"id": t.get("id",""), "title": t.get("title",""), "type": t.get("type",""), "url": (t.get("url","") or "")[:100]}
                          for t in app.get("targets", []) if t.get("type") not in ("worker","service_worker")]
    return json.dumps({"current_port": EXTERNAL_CDP_PORT, "apps": info}, indent=2, ensure_ascii=False)


async def ext_select_app(port=0, target_id=""):
    global EXTERNAL_CDP_PORT, EXTERNAL_CDP_WS_URL
    if port == 0:
        EXTERNAL_CDP_PORT = 0
        EXTERNAL_CDP_WS_URL = None
        return "已切换回内置浏览器"
    from py.local_app_control import get_connection_info, switch_external_target
    info = get_connection_info(port)
    if not info:
        return f"端口 {port} 未连接"
    if target_id:
        r = await switch_external_target(port, target_id)
        if not r.get("success"):
            return f"切换失败: {r.get('error')}"
        t = r.get("target", {})
        EXTERNAL_CDP_PORT = port
        return f"已切换到 {info.get('appName')} target: {t.get('title')} (type={t.get('type')})"
    EXTERNAL_CDP_PORT = port
    return f"已切换到 {info.get('appName')} (port={port})"


async def ext_refresh_targets(port=0):
    from py.local_app_control import refresh_external_targets
    r = await refresh_external_targets(port)
    targets = r.get("targets", [])
    return json.dumps({"port": port, "targets": [{"id":t.get("id",""),"title":t.get("title",""),"type":t.get("type","")} for t in targets if t.get("type") not in ("worker","service_worker")]}, indent=2, ensure_ascii=False)


async def ext_click_by_text(text):
    script = f"""
    function() {{
        const q = {json.dumps(text)};
        const sel = 'a, button, [role="button"], [role="tab"], [role="menuitem"], li, div, span, [aria-label]';
        const els = document.querySelectorAll(sel);
        let best = null, bestScore = 0;
        for (const el of els) {{
            if (el.offsetWidth === 0) continue;
            let score = 0;
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const tit = (el.getAttribute('title') || '').toLowerCase();
            const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (aria === q) score = 100;
            else if (aria.includes(q)) score = 80;
            else if (txt === q) score = 60;
            else if (txt.includes(q)) score = 40;
            else if (tit === q) score = 30;
            else if (tit.includes(q)) score = 20;
            if (score > bestScore) {{ best = el; bestScore = score; }}
        }}
        if (!best) return JSON.stringify({{error: 'text "' + q + '" not found'}});
        const ariaLabel = best.getAttribute('aria-label') || '';
        best.scrollIntoView({{behavior:'instant', block:'center'}});
        best.focus();
        best.click();
        return JSON.stringify({{tag: best.tagName, text: (best.innerText||'').slice(0,40), ariaLabel: ariaLabel.slice(0,60), score: bestScore}});
    }}
    """
    r = await _ext_cmd("Runtime.evaluate", {"expression": "(" + script + ")()", "returnByValue": True})
    raw = r.get("result", {}).get("value", "")
    if isinstance(raw, str) and raw.startswith("{"):
        d = json.loads(raw)
        if "error" in d:
            return d["error"]
        return f"已点击 {d.get('tag','?')} '{d.get('ariaLabel') or d.get('text','')}' (score: {d.get('score',0)})"
    return f"click_by_text: {raw}"


ext_app_tools = [
    {"type": "function", "function": {"name": "ext_list_apps", "description": "列出已连接的外部 Electron 应用的 CDP 端口和 targets（page/webview）。", "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {"name": "ext_select_app", "description": "选择外部 Electron 应用到当前操作目标。port=0 切回内置浏览器。可指定 target_id 跳转到某个 webview。", "parameters": {"type": "object", "properties": {"port": {"type": "integer"}, "target_id": {"type": "string"}, }, "required": ["port"]}}},
    {"type": "function", "function": {"name": "ext_refresh_targets", "description": "刷新外部应用 target 列表（打开新 webview 后使用）。", "parameters": {"type": "object", "properties": {"port": {"type": "integer"}, }, "required": ["port"]}}},
    {"type": "function", "function": {"name": "ext_click", "description": "点击外部应用中的元素（通过 snapshot 获取的 UID）。如果不是 button 会提示改用 ext_click_by_text。", "parameters": {"type": "object", "properties": {"uid": {"type": "string"}, "dblClick": {"type": "boolean"}}, "required": ["uid"]}}},
    {"type": "function", "function": {"name": "ext_fill", "description": "在外部应用的输入框中填入文字。", "parameters": {"type": "object", "properties": {"uid": {"type": "string"}, "value": {"type": "string"}}, "required": ["uid", "value"]}}},
    {"type": "function", "function": {"name": "ext_screenshot", "description": "截取当前选中的外部应用页面。", "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {"name": "ext_snapshot", "description": "获取外部应用当前页面的可交互元素快照（含 UID）。", "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {"name": "ext_evaluate_script", "description": "在外部应用中执行 JS 代码。", "parameters": {"type": "object", "properties": {"script_code": {"type": "string"}}, "required": ["script_code"]}}},
    {"type": "function", "function": {"name": "ext_hover", "description": "悬停在外部应用元素上。", "parameters": {"type": "object", "properties": {"uid": {"type": "string"}}, "required": ["uid"]}}},
    {"type": "function", "function": {"name": "ext_press_key", "description": "在外部应用中按键。", "parameters": {"type": "object", "properties": {"key": {"type": "string"}}, "required": ["key"]}}},
    {"type": "function", "function": {"name": "ext_wait_for", "description": "等待外部应用页面出现指定文字。", "parameters": {"type": "object", "properties": {"text": {"type": "string"}, "timeout": {"type": "integer"}}, "required": ["text"]}}},
    {"type": "function", "function": {"name": "ext_click_by_text", "description": "在外部应用中对包含指定关键词（aria-label / 文本）的元素进行点击。", "parameters": {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}}},
]
