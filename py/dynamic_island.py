# -*- coding: utf-8 -*-
"""
灵动岛 (Dynamic Island) 后端模块
"""

import asyncio
from typing import Dict, List


_island_enabled = False
_macos_active_player = None  # "Spotify" or "Music"

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
    {
        "name": "island_task_create",
        "description": "在灵动岛上创建一条待办事项，可指定截止时间",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "待办内容"},
                "due_time": {"type": "string", "description": "截止时间 ISO 格式或 HH:MM 格式, 可选"}
            },
            "required": ["text"]
        }
    },
    {
        "name": "island_task_list",
        "description": "列出灵动岛上所有待办事项",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "island_task_complete",
        "description": "按文本关键词匹配并标记完成灵动岛上的一条待办事项",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "待办内容关键词（模糊匹配）"}
            },
            "required": ["text"]
        }
    },
    {
        "name": "island_task_delete",
        "description": "按文本关键词匹配并删除灵动岛上的一条待办事项",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "待办内容关键词（模糊匹配）"}
            },
            "required": ["text"]
        }
    },
]


def _mpris_call(method_name):
    import platform
    if platform.system() != "Linux":
        return False
    try:
        from jeepney import DBusAddress, new_method_call
        from jeepney.io.blocking import open_dbus_connection

        with open_dbus_connection(bus='SESSION') as conn:
            list_msg = new_method_call(
                DBusAddress('/org/freedesktop/DBus',
                            bus_name='org.freedesktop.DBus',
                            interface='org.freedesktop.DBus'),
                'ListNames'
            )
            reply = conn.send_and_get_reply(list_msg, timeout=5)
            players = [n for n in reply.body[0] if n.startswith('org.mpris.MediaPlayer2.')]
            if not players:
                return False

            player_addr = DBusAddress(
                '/org/mpris/MediaPlayer2',
                bus_name=players[0],
                interface='org.mpris.MediaPlayer2.Player'
            )
            conn.send_and_get_reply(new_method_call(player_addr, method_name), timeout=5)
            return True
    except Exception:
        return False


def _mpris_get_metadata():
    import platform
    if platform.system() != "Linux":
        return None
    try:
        from jeepney import DBusAddress, new_method_call
        from jeepney.io.blocking import open_dbus_connection

        with open_dbus_connection(bus='SESSION') as conn:
            list_msg = new_method_call(
                DBusAddress('/org/freedesktop/DBus',
                            bus_name='org.freedesktop.DBus',
                            interface='org.freedesktop.DBus'),
                'ListNames'
            )
            reply = conn.send_and_get_reply(list_msg, timeout=5)
            players = [n for n in reply.body[0] if n.startswith('org.mpris.MediaPlayer2.')]
            if not players:
                return None

            player = players[0]

            props_addr = DBusAddress(
                '/org/mpris/MediaPlayer2',
                bus_name=player,
                interface='org.freedesktop.DBus.Properties'
            )

            status_msg = new_method_call(props_addr, 'Get', 'ss',
                                         ('org.mpris.MediaPlayer2.Player', 'PlaybackStatus'))
            status_reply = conn.send_and_get_reply(status_msg, timeout=5)
            status = status_reply.body[0][1]

            meta_msg = new_method_call(props_addr, 'Get', 'ss',
                                       ('org.mpris.MediaPlayer2.Player', 'Metadata'))
            meta_reply = conn.send_and_get_reply(meta_msg, timeout=5)
            metadata = meta_reply.body[0][1]

            title = ""
            artist = ""
            art_url = None

            for key, val in metadata.items():
                if key == 'xesam:title':
                    title = str(val[1])
                elif key == 'xesam:artist':
                    artist = str(val[1][0]) if val[1] else ""
                elif key == 'mpris:artUrl':
                    art_url = str(val[1])

            return {
                "track": title if title else "播放中",
                "artist": artist,
                "isPlaying": status == "Playing",
                "artworkUrl": art_url,
                "sourceAppId": player.replace("org.mpris.MediaPlayer2.", "")
            }
    except Exception:
        return None


def _media_key(key_name: str):
    try:
        import pyautogui
        pyautogui.FAILSAFE = False
        pyautogui.press(key_name)
    except Exception as e:
        print(f"[DynamicIsland] pyautogui press {key_name} failed: {e}")


def _macos_media_command(command: str, player: str = ""):
    import subprocess

    if not player:
        player = _macos_active_player

    command_map = {
        "play": {"Spotify": "play", "Music": "play"},
        "pause": {"Spotify": "pause", "Music": "pause"},
        "next_track": {"Spotify": "next track", "Music": "next track"},
        "previous_track": {"Spotify": "previous track", "Music": "previous track"},
    }

    try:
        targets = [player] if player else ["Spotify", "Music"]
        for app in targets:
            cmd = command_map.get(command, {}).get(app, "")
            if not cmd:
                continue
            script = f'tell application "{app}" to {cmd}'
            try:
                subprocess.run(
                    ["osascript", "-e", script],
                    capture_output=True, timeout=5
                )
                print(f"[DynamicIsland] AppleScript sent to {app}: {cmd}")
            except Exception as e:
                print(f"[DynamicIsland] AppleScript {app} {cmd} failed: {e}")
    except Exception as e:
        print(f"[DynamicIsland] _macos_media_command error: {e}")


def island_music_play():
    import platform
    system = platform.system()
    if system == "Linux":
        if _mpris_call('PlayPause'):
            return "已发送播放指令。"
        return "未检测到 MPRIS 播放器。"
    if system == "Darwin":
        _macos_media_command("play")
        return "已发送播放指令。"
    _media_key('playpause')
    return "已发送播放指令。"


def island_music_pause():
    import platform
    system = platform.system()
    if system == "Linux":
        if _mpris_call('PlayPause'):
            return "已发送暂停指令。"
        return "未检测到 MPRIS 播放器。"
    if system == "Darwin":
        _macos_media_command("pause")
        return "已发送暂停指令。"
    _media_key('playpause')
    return "已发送暂停指令。"


def island_music_next():
    import platform
    system = platform.system()
    if system == "Linux":
        if _mpris_call('Next'):
            return "已切换到下一首。"
        return "未检测到 MPRIS 播放器。"
    if system == "Darwin":
        _macos_media_command("next_track")
        return "已切换到下一首。"
    _media_key('nexttrack')
    return "已切换到下一首。"


def island_music_prev():
    import platform
    system = platform.system()
    if system == "Linux":
        if _mpris_call('Previous'):
            return "已切换到上一首。"
        return "未检测到 MPRIS 播放器。"
    if system == "Darwin":
        _macos_media_command("previous_track")
        return "已切换到上一首。"
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
        except Exception as e:
            print(f"[DynamicIsland] macOS volume error: {e}")

    # Linux: 使用 pactl 直接设定
    if system == "Linux":
        try:
            subprocess.run(
                ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"],
                capture_output=True, timeout=3
            )
            return f"音量已设置为 {level}%"
        except Exception as e:
            print(f"[DynamicIsland] Linux volume error: {e}")

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
                except Exception as e:
                    print(f"[DynamicIsland] SMTC timeline query error: {e}")
                all_sessions.append({
                    "title": info.title or "",
                    "artist": info.artist or "",
                    "app": s.source_app_user_model_id or "",
                    "playing": int(playback.playback_status) == 4,
                    "position": pos,
                    "timelineSupported": timeline_ok,
                })
            except Exception as e:
                print(f"[DynamicIsland] SMTC session query error: {e}")
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

        def _query_app(app_name):
            script = f'''
tell application "System Events"
    set isRunning to (name of every process) contains "{app_name}"
end tell
if isRunning then
    try
        tell application "{app_name}"
            set s to player state as string
            set n to name of current track
            set a to artist of current track
            return s & "||" & n & "||" & a
        end tell
    end try
end if
return ""
'''
            try:
                rc = subprocess.run(
                    ["osascript", "-e", script],
                    capture_output=True, text=True, timeout=4
                )
                out = rc.stdout.strip()
                if out and "||" in out:
                    parts = out.split("||", 2)
                    return {
                        "source": app_name,
                        "state": parts[0].lower() if len(parts) > 0 else "",
                        "track": parts[1] if len(parts) > 1 else "",
                        "artist": parts[2] if len(parts) > 2 else ""
                    }
            except Exception as e:
                print(f"[DynamicIsland] _query_app {app_name} error: {e}")
            return None

        def _query_macos():
            global _macos_active_player
            spotify_data = _query_app("Spotify")
            music_data = _query_app("Music")

            all_data = [d for d in [spotify_data, music_data] if d is not None]
            if not all_data:
                return None

            preferred = next((d for d in all_data if d["state"] == "playing"), None)
            if not preferred:
                preferred = next((d for d in all_data if d["track"].strip()), None)

            if preferred:
                _macos_active_player = preferred["source"]
                return {
                    "track": preferred["track"],
                    "artist": preferred["artist"],
                    "isPlaying": preferred["state"] == "playing",
                    "sourceAppId": preferred["source"]
                }
            return None

        mac_data = await asyncio.to_thread(_query_macos)
        if mac_data:
            result.update(mac_data)
            return result

    elif platform.system() == "Linux":
        import asyncio

        linux_data = await asyncio.to_thread(_mpris_get_metadata)
        if linux_data:
            result.update(linux_data)
            return result

    return result
