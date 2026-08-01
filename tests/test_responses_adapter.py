"""AsyncResponsesAsOpenAI 冒烟测试:本地 mock Responses API 服务器，无需真实网络。"""
import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

os.environ.setdefault("LITELLM_LOG", "ERROR")

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from py.ResponsesAsOpenAI import AsyncResponsesAsOpenAI

NON_STREAM_RESPONSE = {
    "id": "resp_test",
    "object": "response",
    "created_at": 1700000000,
    "status": "completed",
    "model": "gpt-4o",
    "output": [
        {
            "id": "msg_1",
            "type": "message",
            "role": "assistant",
            "status": "completed",
            "content": [{"type": "output_text", "text": "Hello World", "annotations": []}],
        }
    ],
    "usage": {"input_tokens": 10, "output_tokens": 5, "total_tokens": 15},
}

STREAM_COMPLETED_RESPONSE = {
    "id": "resp_test",
    "object": "response",
    "created_at": 1700000000,
    "status": "completed",
    "model": "gpt-4o",
    "output": [
        {
            "id": "msg_1",
            "type": "message",
            "role": "assistant",
            "status": "completed",
            "content": [{"type": "output_text", "text": "Hello World", "annotations": []}],
        }
    ],
}

STREAM_EVENTS = [
    {"type": "response.created", "response": {"id": "resp_test", "object": "response", "created_at": 1700000000, "status": "in_progress", "output": []}},
    {"type": "response.output_item.added", "output_index": 0, "item": {"id": "msg_1", "type": "message", "role": "assistant", "status": "in_progress", "content": []}},
    {"type": "response.content_part.added", "item_id": "msg_1", "output_index": 0, "content_index": 0, "part": {"type": "output_text", "text": "", "annotations": []}},
    {"type": "response.output_text.delta", "item_id": "msg_1", "output_index": 0, "content_index": 0, "delta": "Hello"},
    {"type": "response.output_text.delta", "item_id": "msg_1", "output_index": 0, "content_index": 0, "delta": " World"},
    {"type": "response.output_text.done", "item_id": "msg_1", "output_index": 0, "content_index": 0, "text": "Hello World"},
    {"type": "response.output_item.done", "output_index": 0, "item": {"id": "msg_1", "type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": "Hello World", "annotations": []}]}},
    {"type": "response.completed", "response": STREAM_COMPLETED_RESPONSE},
]

MODELS_RESPONSE = {"object": "list", "data": [{"id": "gpt-4o"}, {"id": "gpt-5"}]}


class MockHandler(BaseHTTPRequestHandler):
    fail_models = False

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        if self.path.endswith("/responses"):
            if body.get("stream"):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.end_headers()
                for ev in STREAM_EVENTS:
                    self.wfile.write(
                        f"event: {ev['type']}\ndata: {json.dumps(ev)}\n\n".encode()
                    )
            else:
                payload = json.dumps(NON_STREAM_RESPONSE).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path.endswith("/models"):
            if MockHandler.fail_models:
                self.send_response(500)
                self.end_headers()
                return
            payload = json.dumps(MODELS_RESPONSE).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass


def start_server():
    server = HTTPServer(("127.0.0.1", 0), MockHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


async def main():
    server = start_server()
    port = server.server_address[1]
    http_client = httpx.AsyncClient()
    adapter = AsyncResponsesAsOpenAI(
        api_key="test-key",
        base_url=f"http://127.0.0.1:{port}/v1",
        http_client=http_client,
    )

    # 1. 非流式调用
    resp = await adapter.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "hi"}],
    )
    assert resp.choices[0].message.content == "Hello World", resp
    assert resp.usage.total_tokens == 15, resp.usage

    # 2. 流式调用
    chunks = []
    stream = await adapter.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "hi"}],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            chunks.append(delta.content)
    assert "".join(chunks) == "Hello World", chunks

    # 3. 模型列表
    models = await adapter.models.list()
    assert [m.id for m in models.data] == ["gpt-4o", "gpt-5"], models.data

    # 4. tools 透传不报错
    resp2 = await adapter.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "hi"}],
        tools=[{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather",
                "parameters": {"type": "object", "properties": {}},
            },
        }],
    )
    assert resp2.choices[0].message.content == "Hello World", resp2

    # 5. responses/ 前缀重写分支 (responses/gpt-4o -> openai/responses/gpt-4o) 不报错
    resp3 = await adapter.chat.completions.create(
        model="responses/gpt-4o",
        messages=[{"role": "user", "content": "hi"}],
    )
    assert resp3.choices[0].message.content == "Hello World", resp3

    # 6. 模型列表请求失败时返回空列表兜底
    adapter2 = AsyncResponsesAsOpenAI(
        api_key="test-key",
        base_url=f"http://127.0.0.1:{port}/v1",
        http_client=http_client,
    )
    MockHandler.fail_models = True
    models2 = await adapter2.models.list()
    assert models2.data == [], models2.data
    MockHandler.fail_models = False

    await http_client.aclose()
    server.shutdown()
    print("ALL PASS")


if __name__ == "__main__":
    asyncio.run(main())
