import asyncio
import socket
import ssl
import time
from typing import Any, Callable, Optional

class SimpleTwitchChat:
    """
    仅负责“收包-解析-回调”，不再管事件循环。
    生命周期由外部 start_twitch_task / stop_twitch_task 控制。
    """
    def __init__(self, access_token: str, channel: str):
        self.access_token = access_token.replace("oauth:", "")
        self.channel = channel.lower().lstrip("#")
        self._sock: Optional[socket.socket] = None
        self._callback: Optional[Callable[[str, str, str, str], Any]] = None
        self._task: Optional[asyncio.Task] = None
        self._running = False

    # ---------- 外部调用 ----------
    def set_callback(self, cb: Callable[[str, str, str, str], Any]):
        self._callback = cb

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._listen_loop())

    async def stop(self):
        if not self._running:
            return
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._close_socket()

    # ---------- 内部 ----------
    async def _listen_loop(self):
        reconnect_delay = 5
        while self._running:
            try:
                await self._connect_and_read()
                reconnect_delay = 5
            except Exception as exc:
                if not self._running:
                    break
                print(f"[Twitch] 连接异常: {exc}，{reconnect_delay}s 后重连")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, 60)

    async def _connect_and_read(self):
        ctx = ssl.create_default_context()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        self._sock = ctx.wrap_socket(sock, server_hostname="irc.chat.twitch.tv")
        self._sock.connect(("irc.chat.twitch.tv", 6697))
        self._sock.settimeout(None)

        # 认证
        self._send(f"CAP REQ :twitch.tv/tags twitch.tv/commands")
        self._send(f"PASS oauth:{self.access_token}")
        self._send(f"NICK justinfan12345")
        self._send(f"JOIN #{self.channel}")

        buffer = ""
        while self._running:
            data = await asyncio.get_event_loop().sock_recv(self._sock, 4096)
            if not data:
                raise ConnectionAbortedError("服务器关闭连接")
            buffer += data.decode("utf-8", errors="ignore")
            while "\r\n" in buffer:
                line, buffer = buffer.split("\r\n", 1)
                if line:
                    self._handle_line(line)

    def _handle_line(self, line: str):
        """
        Twitch IRC 协议解析核心逻辑
        支持：PRIVMSG(弹幕), USERNOTICE(订阅/赠礼/Raid/公告)
        """
        if line.startswith("PING"):
            self._send("PONG " + line[4:])
            return

        # 1. 解析标签 (Twitch Tags)
        tags = {}
        if line.startswith("@"):
            tag_str, _, line = line[1:].partition(" ")
            for kv in tag_str.split(";"):
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    # 处理 Twitch IRC 协议中的转义字符
                    v = v.replace("\\s", " ").replace("\\:", ";").replace("\\r", "\r").replace("\\n", "\n")
                    tags[k] = v

        # 2. 识别 IRC 命令 (PRIVMSG 或 USERNOTICE)
        parts = line.split(" ")
        command = ""
        for p in parts:
            if p in ["PRIVMSG", "USERNOTICE", "CLEARCHAT"]:
                command = p
                break

        if not command:
            return

        # 3. 提取用户信息
        user = tags.get("display-name") or tags.get("login") or "System"
        msg_content = ""
        danmu_type = "danmaku"

        # 4. 分支处理指令
        if command == "PRIVMSG":
            # --- 普通弹幕 ---
            danmu_type = "danmaku"
            try:
                # 获取 ':' 之后的所有内容作为消息体
                msg_content = line.split(" :", maxsplit=1)[1]
            except: 
                msg_content = ""

        elif command == "USERNOTICE":
            # --- 复杂系统事件 (订阅、赠礼、Raid 等) ---
            msg_id = tags.get("msg-id", "")
            system_msg = tags.get("system-msg", "") # Twitch 官方生成的英文说明
            
            # 尝试提取用户在订阅/公告时附带的自定义文字
            user_text = ""
            try:
                user_text = line.split(" :", maxsplit=1)[1]
            except: 
                pass

            if msg_id in ["sub", "resub"]:
                # 订阅或续订 -> 对应 B 站 "上舰/舰长"
                danmu_type = "buy_guard"
                msg_content = f"{system_msg} | Message: {user_text}" if user_text else system_msg
                
            elif msg_id in ["subgift", "anonsubgift", "submysterygift"]:
                # 赠送订阅 -> 对应 B 站 "礼物"
                danmu_type = "gift"
                msg_content = system_msg
                
            elif msg_id == "raid":
                # 突袭 (其他主播带人进场) -> 对应 B 站 "进场"
                danmu_type = "enter_room"
                msg_content = system_msg
                
            elif msg_id == "announcement":
                # 频道公告 -> 对应普通弹幕，但在内容前加标识
                danmu_type = "danmaku"
                msg_content = f"[Announcement] {user_text}"
                
            else:
                # 其他系统事件处理
                danmu_type = "danmaku"
                msg_content = system_msg if system_msg else user_text

        # 5. 回调给 Service 层
        if self._callback:
            # 回调可为 async 或 sync；直播路由使用 async broadcast。
            result = self._callback(self.channel, user, msg_content, danmu_type)
            if asyncio.iscoroutine(result):
                asyncio.create_task(result)

    def _send(self, msg: str):
        if self._sock:
            self._sock.send(f"{msg}\r\n".encode())

    def _close_socket(self):
        if self._sock:
            try:
                self._sock.close()
            except Exception:
                pass
            self._sock = None


# --------------------------------------------------
# 对外唯一接口
# --------------------------------------------------
_twitch_chat: Optional[SimpleTwitchChat] = None


async def start_twitch_task(config: dict, on_msg_cb: Callable[[str, str, str], None]):
    global _twitch_chat
    if _twitch_chat:
        return
    token = config.get("twitch_access_token", "")
    channel = config.get("twitch_channel", "")
    if not (token and channel):
        raise ValueError("Twitch token 或频道为空")

    _twitch_chat = SimpleTwitchChat(token, channel)
    _twitch_chat.set_callback(on_msg_cb)
    await _twitch_chat.start()
    print("[Twitch] 监听任务已启动")


async def stop_twitch_task():
    global _twitch_chat
    if _twitch_chat:
        await _twitch_chat.stop()
        _twitch_chat = None
        print("[Twitch] 监听任务已停止")
