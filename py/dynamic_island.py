# -*- coding: utf-8 -*-
"""
灵动岛 (Dynamic Island) 后端模块
"""

import asyncio
from typing import Dict, List


_island_enabled = False

ISLAND_TOOLS_SCHEMA = [
    {
        "name": "island_music_play",
        "description": "播放/恢复当前音乐播放器",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_music_pause",
        "description": "暂停当前音乐播放器",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_music_next",
        "description": "切换到下一首歌",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_music_prev",
        "description": "切换到上一首歌",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_music_get_info",
        "description": "获取当前正在播放的音乐信息",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_music_set_volume",
        "description": "调整系统媒体音量，level 为 0-100 的整数",
        "parameters": {
            "type": "object",
            "properties": {
                "level": {
                    "type": "integer",
                    "description": "目标音量 0-100",
                    "minimum": 0,
                    "maximum": 100
                }
            },
            "required": ["level"]
        }
    },
]


def _media_key(key_name: str):
    try:
        import pyautogui
        pyautogui.FAILSAFE = False
        pyautogui.press(key_name)
    except Exception:
        pass


def island_music_play():
    _media_key('playpause')
    return "已发送播放指令。"


def island_music_pause():
    _media_key('playpause')
    return "已发送暂停指令。"


def island_music_next():
    _media_key('nexttrack')
    return "已切换到下一首。"


def island_music_prev():
    _media_key('prevtrack')
    return "已切换到上一首。"


def island_music_get_info():
    return (
        "跨平台限制下无法直接读取播放器信息。"
        "您可以通过告诉我当前播放的歌曲名称，我可以帮您显示在灵动岛上。"
    )


def island_music_set_volume(level: int):
    level = max(0, min(100, int(level)))
    import platform, subprocess

    system = platform.system()

    # macOS: 直接设定系统音量
    if system == "Darwin":
        try:
            subprocess.run(
                ["osascript", "-e", f"set volume output volume {level}"],
                capture_output=True, timeout=3
            )
            return f"音量已设置为 {level}%"
        except Exception:
            pass

    # Linux: 使用 pactl 直接设定
    if system == "Linux":
        try:
            subprocess.run(
                ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"],
                capture_output=True, timeout=3
            )
            return f"音量已设置为 {level}%"
        except Exception:
            pass

    # Windows: 使用 pycaw 直接设定
    if system == "Windows":
        try:
            from pycaw.pycaw import AudioUtilities

            devices = AudioUtilities.GetSpeakers()
            ep = devices.EndpointVolume
            ep.SetMasterVolumeLevelScalar(level / 100.0, None)
            return f"音量已设置为 {level}%"
        except Exception as e:
            print(f"[DynamicIsland] pycaw volume error: {e}")

    return f"无法调整音量。"


async def island_track_set(ws_manager, data: dict):
    """推送曲目信息到所有岛窗口"""
    await ws_manager.broadcast({
        "type": "island_track_update",
        "data": data
    })


def island_enable() -> dict:
    """启用灵动岛"""
    global _island_enabled
    _island_enabled = True
    from server import node_ext_mcp_tools

    ext_id = "dynamic_island"
    tools_simplified = [
        {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}
        for t in ISLAND_TOOLS_SCHEMA
    ]
    node_ext_mcp_tools[ext_id] = tools_simplified
    print(f"[DynamicIsland] 已启用，注册 {len(tools_simplified)} 个工具")
    return {"enabled": True, "tools": tools_simplified}


def island_disable() -> dict:
    """禁用灵动岛"""
    global _island_enabled
    _island_enabled = False
    from server import node_ext_mcp_tools

    ext_id = "dynamic_island"
    node_ext_mcp_tools.pop(ext_id, None)
    print(f"[DynamicIsland] 已禁用")
    return {"enabled": False}


def is_island_enabled() -> bool:
    return _island_enabled


def get_island_tools() -> List[dict]:
    return [
        {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}
        for t in ISLAND_TOOLS_SCHEMA
    ]


def _query_smtc_windows():
    """Windows SMTC 查询 (winrt 原生调用)"""
    try:
        from winrt.windows.media.control import (
            GlobalSystemMediaTransportControlsSessionManager as SMTCManager,
        )
    except ImportError:
        print("[DynamicIsland] winrt not installed, SMTC unavailable")
        return None

    async def _query():
        sessions_raw = await SMTCManager.request_async()
        sessions = sessions_raw.get_sessions()
        all_sessions = []
        for s in sessions:
            try:
                info = await s.try_get_media_properties_async()
                playback = s.get_playback_info()
                pos = 0.0
                timeline_ok = False
                try:
                    tl = s.get_timeline_properties()
                    end = tl.end_time.total_seconds()
                    if end > 0:
                        pos = tl.position.total_seconds()
                        timeline_ok = True
                except Exception:
                    pass
                all_sessions.append({
                    "title": info.title or "",
                    "artist": info.artist or "",
                    "app": s.source_app_user_model_id or "",
                    "playing": int(playback.playback_status) == 4,
                    "position": pos,
                    "timelineSupported": timeline_ok,
                })
            except Exception:
                pass
        if not all_sessions:
            return None

        print(f"[DynamicIsland] SMTC sessions: {[(s['app'][-30:], s['title'][:30], s['playing']) for s in all_sessions]}")
        playing = next((s for s in all_sessions if s["playing"]), None)
        if playing:
            return playing
        return all_sessions[0]

    try:
        return _run_async_in_thread(_query())
    except Exception as e:
        print(f"[DynamicIsland] SMTC query error: {e}")
        return None


def _run_async_in_thread(coro):
    import asyncio as _asyncio, threading
    result_container = {"data": None, "error": None}

    def _runner():
        try:
            loop = _asyncio.new_event_loop()
            _asyncio.set_event_loop(loop)
            result_container["data"] = loop.run_until_complete(coro)
            loop.close()
        except Exception as e:
            result_container["error"] = str(e)

    t = threading.Thread(target=_runner)
    t.start()
    t.join()
    if result_container["error"]:
        print(f"[DynamicIsland] SMTC thread error: {result_container['error']}")
    return result_container["data"]


async def poll_music_state():
    """轮询当前音乐播放状态，返回 { track?, artist?, isPlaying }"""
    import platform, asyncio

    result = {"isPlaying": False}

    if platform.system() == "Windows":
        smtc_data = await asyncio.to_thread(_query_smtc_windows)
        if smtc_data:
            title = smtc_data.get("title", "") or ""
            artist = smtc_data.get("artist", "") or ""
            source = smtc_data.get("app", "")
            is_playing = smtc_data.get("playing", False)
            if title:
                result["isPlaying"] = is_playing
                result["track"] = title
                if artist:
                    result["artist"] = artist
                result["sourceAppId"] = source
                result["position"] = smtc_data.get("position", 0)
                result["timelineSupported"] = smtc_data.get("timelineSupported", False)
                print(f"[DynamicIsland] SMTC hit: isPlaying={is_playing}, track={title[:30]}, timeline={result['timelineSupported']}")
                return result
            elif source:
                result["isPlaying"] = is_playing
                result["track"] = f"SMTC: {source.split('.')[-1] if '.' in source else source[-30:]}"
                if artist:
                    result["artist"] = artist
                result["sourceAppId"] = source
                result["position"] = smtc_data.get("position", 0)
                result["timelineSupported"] = smtc_data.get("timelineSupported", False)
                print(f"[DynamicIsland] SMTC session detected (no title): isPlaying={is_playing}, source={source[-40:]}")
                return result

    elif platform.system() == "Darwin":
        import subprocess, asyncio
        def _query_macos():
            script = '''
set output to ""
tell application "System Events"
    set spotifyRunning to (name of every process) contains "Spotify"
    set musicRunning to (name of every process) contains "Music"
end tell
if spotifyRunning then
    try
        tell application "Spotify"
            set s to player state as string
            set n to name of current track
            set a to artist of current track
            set output to "Spotify||" & s & "||" & n & "||" & a
        end tell
    end try
else if musicRunning then
    try
        tell application "Music"
            set s to player state as string
            set n to name of current track
            set a to artist of current track
            set output to "Music||" & s & "||" & n & "||" & a
        end tell
    end try
end if
return output
'''
            try:
                rc = subprocess.run(["osascript", "-e", script],
                                    capture_output=True, text=True, timeout=6)
                out = rc.stdout.strip()
                if out and "||" in out:
                    parts = out.split("||", 3)
                    source = parts[0]
                    state = parts[1].lower() if len(parts) > 1 else ""
                    track = parts[2] if len(parts) > 2 else ""
                    artist = parts[3] if len(parts) > 3 else ""
                    return {
                        "track": track,
                        "artist": artist,
                        "isPlaying": state == "playing",
                        "sourceAppId": source
                    }
            except Exception:
                pass
            return None

        mac_data = await asyncio.to_thread(_query_macos)
        if mac_data:
            result.update(mac_data)
            return result

    elif platform.system() == "Linux":
        import subprocess, asyncio
        def _query_linux():
            try:
                rc = subprocess.run(["playerctl", "status"], capture_output=True, text=True, timeout=4)
                if rc.stdout.strip():
                    rc2 = subprocess.run(
                        ["playerctl", "metadata", "--format", "{{title}}||{{artist}}||{{status}}||{{mpris:artUrl}}"],
                        capture_output=True, text=True, timeout=4
                    )
                    parts = rc2.stdout.strip().split("||", 3)
                    return {
                        "track": parts[0] if parts[0] else "播放中",
                        "artist": parts[1] if len(parts) > 1 and parts[1] else "",
                        "isPlaying": "playing" in (parts[2] or rc.stdout.strip()).lower() if len(parts) > 2 else (rc.stdout.strip().lower() == "playing"),
                        "artworkUrl": parts[3] if len(parts) > 3 else None,
                        "sourceAppId": "System"
                    }
            except Exception:
                pass
            return None

        linux_data = await asyncio.to_thread(_query_linux)
        if linux_data:
            result.update(linux_data)
            return result

    return result
