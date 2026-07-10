import json
import asyncio
import websockets
import requests
from typing import Dict, Optional, List

_外部连接: Dict[int, dict] = {}


def _ws_alive(ws) -> bool:
    """websockets 16+ 没有 .closed 属性，改用 close_code"""
    try:
        return ws.close_code is None
    except Exception:
        return False


def get_connected_ports() -> List[int]:
    return list(_外部连接.keys())


def get_connection_info(port: int) -> Optional[dict]:
    conn = _外部连接.get(port)
    if conn:
        return {
            "port": port,
            "appName": conn.get("app_name", ""),
            "appId": conn.get("app_id", ""),
            "targets": conn.get("targets", []),
            "activeWsUrl": conn.get("active_ws_url"),
            "activeTargetId": conn.get("active_target_id", ""),
        }
    return None


def get_all_connection_info() -> List[dict]:
    ports = list(_外部连接.keys())
    print(f"[LocalAppControl] get_all_connection_info: ports={ports}, total={len(ports)}")
    return [get_connection_info(p) for p in ports]


async def get_external_cdp_targets(port: int) -> List[dict]:
    try:
        resp = requests.get(f"http://127.0.0.1:{port}/json/list", timeout=3)
        return resp.json()
    except Exception as e:
        print(f"[LocalAppControl] 获取 CDP targets 失败 (port {port}): {e}")
        return []


def _pick_best_target(targets, preferred_id=None):
    if preferred_id:
        for t in targets:
            if t.get("id") == preferred_id:
                return t.get("webSocketDebuggerUrl")
    for t in targets:
        if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
            return t.get("webSocketDebuggerUrl")
    for t in targets:
        if t.get("type") == "webview" and t.get("webSocketDebuggerUrl"):
            return t.get("webSocketDebuggerUrl")
    for t in targets:
        if t.get("webSocketDebuggerUrl"):
            return t["webSocketDebuggerUrl"]
    return None


async def connect_to_external_app(port: int, app_id: str = "", app_name: str = "") -> dict:
    if port in _外部连接:
        conn = _外部连接[port]
        if conn.get("ws") and _ws_alive(conn["ws"]):
            print(f"[LocalAppControl] 端口 {port} 已有连接，复用")
            return {"success": True, "message": "已连接", "targets": conn.get("targets", [])}

    print(f"[LocalAppControl] 正在连接端口 {port} (app: {app_name})...")
    try:
        resp = requests.get(f"http://127.0.0.1:{port}/json/list", timeout=3)
        targets = resp.json()
    except Exception as e:
        print(f"[LocalAppControl] 连接 fail (port {port}): {e}")
        return {"success": False, "error": str(e), "targets": []}

    ws_url = _pick_best_target(targets)
    first_target = None
    for t in targets:
        if t.get("type") in ("page", "webview") and t.get("webSocketDebuggerUrl"):
            first_target = t
            break
    if not first_target:
        for t in targets:
            if t.get("webSocketDebuggerUrl"):
                first_target = t
                break

    _外部连接[port] = {
        "targets": targets,
        "ws": None,
        "active_ws_url": ws_url,
        "active_target_id": first_target.get("id", "") if first_target else "",
        "connected_at": asyncio.get_event_loop().time(),
        "app_name": app_name,
        "app_id": app_id,
    }

    if ws_url:
        try:
            ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
            _外部连接[port]["ws"] = ws
            print(f"[LocalAppControl] 端口 {port} WebSocket 连接成功")
        except Exception as e:
            print(f"[LocalAppControl] WebSocket 连接失败 (port {port}): {e}")

    page_count = len([t for t in targets if t.get("type") == "page"])
    webview_count = len([t for t in targets if t.get("type") == "webview"])
    usable_count = len([t for t in targets if t.get("webSocketDebuggerUrl") and t.get("type") not in ("worker","service_worker","shared_worker")])
    print(f"[LocalAppControl] 端口 {port}: {len(targets)} targets (page={page_count}, webview={webview_count}, usable={usable_count})")
    return {"success": True, "message": "连接成功", "targets": targets, "activeWsUrl": ws_url, "usableCount": usable_count}


async def disconnect_from_external_app(port: int) -> dict:
    print(f"[LocalAppControl] 断开端口 {port}")
    conn = _外部连接.pop(port, None)
    if conn:
        ws = conn.get("ws")
        if ws:
            try:
                if _ws_alive(ws):
                    await asyncio.wait_for(ws.close(), timeout=3)
            except (asyncio.TimeoutError, Exception) as e:
                print(f"[LocalAppControl] 端口 {port} WS 关闭异常: {e}")
    print(f"[LocalAppControl] 端口 {port} 已移除，剩余: {list(_外部连接.keys())}")
    return {"success": True}


async def switch_external_target(port: int, target_id: str = "") -> dict:
    conn = _外部连接.get(port)
    if not conn:
        return {"error": f"端口 {port} 未连接", "success": False}

    targets = conn.get("targets", [])
    if not targets:
        targets = await get_external_cdp_targets(port)
        _外部连接[port]["targets"] = targets

    target = None
    for t in targets:
        if target_id and t.get("id") == target_id:
            target = t
            break
    if not target:
        for t in targets:
            if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
                target = t
                break
    if not target:
        for t in targets:
            if t.get("type") == "webview" and t.get("webSocketDebuggerUrl"):
                target = t
                break
    if not target:
        for t in targets:
            if t.get("webSocketDebuggerUrl"):
                target = t
                break

    if not target:
        return {"error": "找不到可用的 target", "success": False}

    ws_url = target.get("webSocketDebuggerUrl")
    if not ws_url:
        return {"error": "目标没有 webSocketDebuggerUrl", "success": False}

    old_ws = conn.get("ws")
    if old_ws and _ws_alive(old_ws):
        try:
            await old_ws.close()
        except Exception:
            pass

    try:
        ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
        _外部连接[port]["ws"] = ws
        _外部连接[port]["active_ws_url"] = ws_url
        _外部连接[port]["active_target_id"] = target.get("id", "")
        print(f"[LocalAppControl] 端口 {port} 切换到 target: {target.get('title','')} (type={target.get('type')}, id={target.get('id')})")
        return {"success": True, "target": {"title": target.get("title"), "type": target.get("type"), "url": target.get("url"), "id": target.get("id")}}
    except Exception as e:
        return {"error": str(e), "success": False}


async def refresh_external_targets(port: int) -> dict:
    try:
        targets = await get_external_cdp_targets(port)
        _外部连接[port]["targets"] = targets
        print(f"[LocalAppControl] 端口 {port} targets 已刷新: {len(targets)}")
        return {"success": True, "targets": targets}
    except Exception as e:
        return {"error": str(e), "success": False}


async def execute_external_cdp(port: int, method: str, params: Optional[dict] = None) -> dict:
    conn = _外部连接.get(port)
    if not conn:
        return {"error": "未连接", "success": False}

    ws = conn.get("ws")
    ws_url = conn.get("active_ws_url")

    if ws and _ws_alive(ws):
        return await _send_cdp(ws, method, params or {})

    if ws_url:
        try:
            ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
            _外部连接[port]["ws"] = ws
            return await _send_cdp(ws, method, params or {})
        except Exception as e:
            return {"error": str(e), "success": False}

    targets = await get_external_cdp_targets(port)
    _外部连接[port]["targets"] = targets
    ws_url = _pick_best_target(targets)
    if ws_url:
        try:
            ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
            _外部连接[port]["ws"] = ws
            _外部连接[port]["active_ws_url"] = ws_url
            return await _send_cdp(ws, method, params or {})
        except Exception as e:
            return {"error": str(e), "success": False}

    return {"error": "找不到可连接的 target", "success": False}


async def select_external_target(port: int, target_url: str) -> dict:
    try:
        ws = await websockets.connect(target_url, max_size=10 * 1024 * 1024)
        if port in _外部连接:
            old_ws = _外部连接[port].get("ws")
            if old_ws and _ws_alive(old_ws):
                try:
                    await old_ws.close()
                except Exception:
                    pass
        _外部连接[port]["ws"] = ws
        _外部连接[port]["active_ws_url"] = target_url
        return {"success": True}
    except Exception as e:
        return {"error": str(e), "success": False}


async def _send_cdp(ws, method: str, params: dict) -> dict:
    cmd_id = 1
    message = {"id": cmd_id, "method": method, "params": params}
    await ws.send(json.dumps(message))
    while True:
        response = await ws.recv()
        data = json.loads(response)
        if data.get("id") == cmd_id:
            return data.get("result", {})


async def cleanup_all():
    for port in list(_外部连接.keys()):
        await disconnect_from_external_app(port)
