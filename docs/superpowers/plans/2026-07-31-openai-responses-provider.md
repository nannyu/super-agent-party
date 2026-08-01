# OpenAI Responses API 模型提供商接入 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `OpenAIResponses` vendor 类型,通过 litellm 的 `openai/responses/` 前缀桥接接入 OpenAI Responses API 端点。

**Architecture:** 新建 `py/ResponsesAsOpenAI.py` 适配器,完全模拟 `AsyncOpenAI` 接口(`chat.completions.create` / `models.list`),内部以 `model="openai/responses/<model>"` 调用 `litellm.acompletion()`。litellm 1.83.13 内置的 `responses_api_bridge` 自动完成 Chat Completions ↔ Responses API 双向转换(消息→input、tools、流式事件、usage、reasoning_content)。注意:必须带 `openai/` 路由前缀——裸 `responses/<model>` 无法在 `get_llm_provider` 解析 provider(抛 BadRequestError),`openai/responses/<model>` 剥掉 `openai/` 后剩 `responses/<model>` 才命中桥接。`server.py` 按 vendor 分发到新适配器,前端新增 vendor 选项。

**Tech Stack:** Python 3.12, litellm>=1.83.7(当前 1.83.13,已含桥接), FastAPI, Vue 3(内联 JS), Electron。

## Global Constraints

- 项目**无 pytest** 测试框架:测试用纯 Python 脚本(`.venv/bin/python tests/xxx.py`),不用 pytest
- litellm 版本**不升级**(1.83.13 已含 `responses_api_bridge`)
- vendor 字符串固定为 `'OpenAIResponses'`,全仓一致
- 不改变现有 OpenAI/其他 vendor 行为;不新增 Responses API 特有 UI
- 代码风格:仿照 `py/ClaudeAsOpenAI.py`(中文注释、懒加载 litellm、模拟 AsyncOpenAI 接口)
- 提交信息用中文 + conventional 前缀(如 `feat:`, `docs:`),见 git log 现有风格

---

### Task 1: 后端适配器 `py/ResponsesAsOpenAI.py` + 冒烟测试

**Files:**
- Create: `py/ResponsesAsOpenAI.py`
- Create: `tests/test_responses_adapter.py`(纯脚本,无 pytest)

**Interfaces:**
- Produces: `AsyncResponsesAsOpenAI(api_key, base_url=None, default_model=None, http_client=None, timeout=None, max_retries=None, **kwargs)`
  - `await adapter.chat.completions.create(model, messages, temperature, max_tokens, stream, top_p, stop, tools, tool_choice, **kwargs)` → litellm 返回的 `ModelResponse`(非流式)或 `CustomStreamWrapper`(流式,可 `async for` 迭代,块含 `.choices[0].delta.content`)
  - `await adapter.models.list()` → `{data: [ModelItem]}`(ModelItem 有 `.id`)

- [ ] **Step 1: 编写适配器 `py/ResponsesAsOpenAI.py`**

```python
import httpx
from typing import Optional, List, Dict, Any

class AsyncResponsesAsOpenAI:
    """
    完全模拟 AsyncOpenAI 客户端，底层用 litellm.acompletion 的 openai/responses/ 前缀桥接
    (litellm 自动完成 Chat Completions <-> Responses API 双向转换)
    """

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        default_model: Optional[str] = "gpt-4o",
        http_client: Optional[httpx.AsyncClient] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
        **kwargs
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.default_model = default_model
        self.http_client = http_client
        self.timeout = timeout
        self.max_retries = max_retries
        self._extra_kwargs = kwargs
        self._litellm_module = None  # 缓存 litellm 模块

    @property
    def _litellm(self):
        """懒加载 litellm，第一次调用时才 import"""
        if self._litellm_module is None:
            import litellm
            self._litellm_module = litellm
        return self._litellm_module

    @property
    def models(self):
        return self._ModelsResource(self)

    class _ModelsResource:
        def __init__(self, parent: "AsyncResponsesAsOpenAI"):
            self._parent = parent

        async def list(self):
            # 构造兼容 OpenAI 返回形式的对象
            class ModelItem:
                def __init__(self, model_id: str):
                    self.id = model_id

            class ModelList:
                def __init__(self, data: list):
                    self.data = data

            # Responses API 服务商的模型列表端点仍是 OpenAI 兼容的 /models
            base_url = self._parent.base_url or "https://api.openai.com/v1"
            if base_url.endswith("/v1") or base_url.endswith("/v1/"):
                url = f"{base_url.rstrip('/')}/models"
            else:
                url = f"{base_url.rstrip('/')}/v1/models"

            headers = {"Authorization": f"Bearer {self._parent.api_key}"}

            try:
                # 优先复用全局 http_client 以走系统代理配置
                client = self._parent.http_client
                need_close = False
                if not client:
                    client = httpx.AsyncClient()
                    need_close = True

                response = await client.get(url, headers=headers)

                if need_close:
                    await client.aclose()

                if response.status_code == 200:
                    data = response.json()
                    models = [ModelItem(m["id"]) for m in data.get("data", [])]
                    if models:
                        return ModelList(models)
            except Exception as e:
                print(f"动态获取 OpenAI Responses 模型列表失败 (可能代理/服务商不支持): {e}")

            # [静态兜底方案]：请求失败时返回空列表，前端可手动输入模型名
            return ModelList([])

    @property
    def chat(self):
        return self._ChatResource(self)

    class _ChatResource:
        def __init__(self, parent: "AsyncResponsesAsOpenAI"):
            self.completions = self._CompletionsResource(parent)

        class _CompletionsResource:
            def __init__(self, parent: "AsyncResponsesAsOpenAI"):
                self._parent = parent

            async def create(
                self,
                model: Optional[str] = None,
                messages: Optional[List[Dict[str, Any]]] = None,
                temperature: Optional[float] = None,
                max_tokens: Optional[int] = None,
                stream: bool = False,
                top_p: Optional[float] = None,
                stop: Optional[Any] = None,
                tools: Optional[List[Dict]] = None,
                tool_choice: Optional[Any] = None,
                **kwargs
            ):
                model = model or self._parent.default_model
                if not model:
                    raise ValueError("model is required")

                # openai/responses/ 前缀触发 litellm 的 responses_api_bridge
                # (注意: litellm 1.83.x 中裸 "responses/" 前缀无法在 get_llm_provider 解析 provider,
                #  必须带 "openai/" 路由前缀; 桥接内部会把模型名去掉前缀再调 /responses 端点)
                if model.startswith("responses/"):
                    # responses/gpt-4o -> openai/responses/gpt-4o
                    model = f"openai/{model}"
                elif not model.startswith("openai/responses/"):
                    model = f"openai/responses/{model}"

                # ===== 懒加载 litellm =====
                litellm = self._parent._litellm

                completion_kwargs = {
                    "model": model,
                    "messages": messages,
                    "api_key": self._parent.api_key,
                    "stream": stream,
                }

                # tools 直接传 OpenAI 函数格式，桥接自动转换为 Responses API 格式
                if tools:
                    completion_kwargs["tools"] = tools
                if tool_choice:
                    completion_kwargs["tool_choice"] = tool_choice

                if self._parent.base_url:
                    completion_kwargs["api_base"] = self._parent.base_url
                if temperature is not None:
                    completion_kwargs["temperature"] = temperature
                if max_tokens is not None:
                    completion_kwargs["max_tokens"] = max_tokens
                if top_p is not None:
                    completion_kwargs["top_p"] = top_p
                if stop is not None:
                    completion_kwargs["stop"] = stop
                if self._parent.timeout is not None:
                    completion_kwargs["timeout"] = self._parent.timeout
                if self._parent.http_client is not None:
                    completion_kwargs["client"] = self._parent.http_client

                # 过滤桥接不支持的 OpenAI 特有参数；response_format、reasoning_effort 等
                # 由桥接映射为 Responses API 参数，原样透传
                safe_kwargs = {k: v for k, v in kwargs.items()
                              if k not in ['logprobs', 'top_logprobs', 'n']}

                return await litellm.acompletion(**completion_kwargs, **safe_kwargs)
```

- [ ] **Step 2: 编写冒烟测试 `tests/test_responses_adapter.py`**

本地起一个 mock Responses API HTTP 服务器(非流式 JSON + SSE 流式 + `/models` 列表),端到端验证适配器→litellm 桥接→本地端点全链路:

```python
"""AsyncResponsesAsOpenAI 冒烟测试:本地 mock Responses API 服务器，无需真实网络。"""
import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

os.environ.setdefault("LITELLM_LOG", "ERROR")

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

STREAM_EVENTS = [
    {"type": "response.created", "response": {"id": "resp_test", "object": "response", "status": "in_progress", "output": []}},
    {"type": "response.output_item.added", "output_index": 0, "item": {"id": "msg_1", "type": "message", "role": "assistant", "status": "in_progress", "content": []}},
    {"type": "response.content_part.added", "item_id": "msg_1", "output_index": 0, "content_index": 0, "part": {"type": "output_text", "text": "", "annotations": []}},
    {"type": "response.output_text.delta", "item_id": "msg_1", "output_index": 0, "content_index": 0, "delta": "Hello"},
    {"type": "response.output_text.delta", "item_id": "msg_1", "output_index": 0, "content_index": 0, "delta": " World"},
    {"type": "response.output_text.done", "item_id": "msg_1", "output_index": 0, "content_index": 0, "text": "Hello World"},
    {"type": "response.output_item.done", "output_index": 0, "item": {"id": "msg_1", "type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": "Hello World", "annotations": []}]}},
    {"type": "response.completed", "response": NON_STREAM_RESPONSE},
]

MODELS_RESPONSE = {"object": "list", "data": [{"id": "gpt-4o"}, {"id": "gpt-5"}]}


class MockHandler(BaseHTTPRequestHandler):
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

    await http_client.aclose()
    server.shutdown()
    print("ALL PASS")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 3: 运行冒烟测试,通过即完成本任务核心验证**

Run: `.venv/bin/python tests/test_responses_adapter.py`
Expected: 输出 `ALL PASS`

如果失败,按输出逐项排查(最常见两类:mock 事件格式与桥接期望不完全一致 → 参考 `.venv/lib/python3.12/site-packages/litellm/completion_extras/litellm_responses_transformation/transformation.py` 的 `translate_responses_chunk_to_openai_stream` 调整事件字段;或网络/代理导致 → 已设 `no_proxy` 则忽略,检查 `LITELLM_LOG=ERROR` 后真实错误信息)。

- [ ] **Step 4: 语法检查**

Run: `.venv/bin/python -m py_compile py/ResponsesAsOpenAI.py tests/test_responses_adapter.py`
Expected: 无输出,退出码 0

- [ ] **Step 5: 提交**

```bash
git add py/ResponsesAsOpenAI.py tests/test_responses_adapter.py
git commit -m "feat: 新增 OpenAI Responses API 模型提供商适配器 (litellm openai/responses/ 桥接)"
```

---

### Task 2: 后端分发 `server.py`

**Files:**
- Modify: `server.py:471-473`(import 区)
- Modify: `server.py:739-747`(`get_client_class`)
- Modify: `server.py:7045-7072`(`/v1/providers/models`)

**Interfaces:**
- Consumes: Task 1 的 `AsyncResponsesAsOpenAI`(import 路径 `py.ResponsesAsOpenAI`)
- Produces: vendor `'OpenAIResponses'` 在 `get_client_class()` 分发到新适配器;`/v1/providers/models` 用新适配器拉模型列表

- [ ] **Step 1: 添加 import**

在 `server.py` 第 473 行 `from py.GeminiAsOpenAI import AsyncGeminiAsOpenAI` 后新增一行:

```python
from py.ResponsesAsOpenAI import AsyncResponsesAsOpenAI
```

- [ ] **Step 2: `get_client_class()` 新增分支**

将 `server.py:740-747`:

```python
    if vendor == 'Dify':
        return DifyOpenAIAsync 
    elif vendor == 'customAnthropic':
        return AsyncClaudeAsOpenAI
    elif vendor == 'Gemini':
        return AsyncGeminiAsOpenAI
    else: 
        return AsyncOpenAI
```

改为:

```python
    if vendor == 'Dify':
        return DifyOpenAIAsync 
    elif vendor == 'customAnthropic':
        return AsyncClaudeAsOpenAI
    elif vendor == 'Gemini':
        return AsyncGeminiAsOpenAI
    elif vendor == 'OpenAIResponses':
        return AsyncResponsesAsOpenAI
    else: 
        return AsyncOpenAI
```

- [ ] **Step 3: `/v1/providers/models` 新增分支**

将 `server.py:7045-7058` 的 Gemini 分支(注释 `# 2. 拦截 Gemini`)之后、Dify 分支之前,插入:

```python
        # 2.5 拦截 OpenAI Responses API
        elif vendor == 'OpenAIResponses':
            client = AsyncResponsesAsOpenAI(
                api_key=request.api_key,
                base_url=request.url,
                http_client=global_http_client
            )
```

- [ ] **Step 4: 验证语法与分支存在**

Run:
```bash
.venv/bin/python -m py_compile server.py
grep -c "AsyncResponsesAsOpenAI" server.py
grep -n "OpenAIResponses" server.py
```
Expected: `py_compile` 无输出退出码 0;grep 计数为 3(import 1 + `get_client_class` 1 + `/v1/providers/models` 1);`grep -n` 显示 3 行

- [ ] **Step 5: 提交**

```bash
git add server.py
git commit -m "feat: server.py 按 vendor 分发 OpenAIResponses 到新适配器"
```

---

### Task 3: 前端 vendor 选项与校验

**Files:**
- Modify: `static/js/vue_data.js:1943`(`vendorValues`)
- Modify: `static/js/vue_methods.js:5596`(`handleVendorChange` 默认 URL 逻辑)
- Modify: `static/js/vue_methods.js:8596-8598`(`goToURL`)
- Modify: `static/js/renderer.js:2011`(`validProvider`)
- Modify: `static/js/locales/zh-CN.js:127`、`static/js/locales/en-US.js:127`(vendor 翻译)

**Interfaces:**
- Produces: vendor `'OpenAIResponses'` 出现在供应商选择列表,被当作"需填 URL 的自定义供应商"处理;显示名称"OpenAI Responses"

- [ ] **Step 1: `vue_data.js` vendorValues 新增选项**

将 `static/js/vue_data.js:1943`:

```js
      'custom','customAnthropic', 'OpenAI','Anthropic', 'Gemini','Grok',
```

改为:

```js
      'custom','customAnthropic','OpenAIResponses', 'OpenAI','Anthropic', 'Gemini','Grok',
```

- [ ] **Step 2: `vue_methods.js` handleVendorChange 不预填默认 URL**

将 `static/js/vue_methods.js:5596`:

```js
      if (value !== 'custom' && value !== 'customAnthropic' ) {
        this.newProviderTemp.url = defaultUrls[value] || ''
      }
```

改为:

```js
      if (value !== 'custom' && value !== 'customAnthropic' && value !== 'OpenAIResponses') {
        this.newProviderTemp.url = defaultUrls[value] || ''
      }
```

- [ ] **Step 3: `vue_methods.js` goToURL 打开用户填的 URL**

将 `static/js/vue_methods.js:8596-8598`:

```js
        else if (provider.vendor === 'customAnthropic'){
          url = provider.url;
        }
```

改为:

```js
        else if (provider.vendor === 'customAnthropic' || provider.vendor === 'OpenAIResponses'){
          url = provider.url;
        }
```

- [ ] **Step 4: `renderer.js` validProvider 校验 URL**

将 `static/js/renderer.js:2011`:

```js
      if (this.newProviderTemp.vendor === 'custom' || this.newProviderTemp.vendor === 'customAnthropic') {
```

改为:

```js
      if (this.newProviderTemp.vendor === 'custom' || this.newProviderTemp.vendor === 'customAnthropic' || this.newProviderTemp.vendor === 'OpenAIResponses') {
```

- [ ] **Step 5: 添加 vendor 翻译**

`static/js/locales/zh-CN.js:127` `'vendor.customAnthropic': '自定义Anthropic',` 之后新增:

```js
        'vendor.OpenAIResponses': 'OpenAI Responses',
```

`static/js/locales/en-US.js:127` `'vendor.customAnthropic': 'Custom Anthropic',` 之后新增:

```js
        'vendor.OpenAIResponses': 'OpenAI Responses',
```

- [ ] **Step 6: 语法检查**

Run:
```bash
node --check static/js/vue_data.js && node --check static/js/vue_methods.js && node --check static/js/renderer.js && node --check static/js/locales/zh-CN.js && node --check static/js/locales/en-US.js
```
Expected: 无输出,退出码 0

- [ ] **Step 7: 提交**

```bash
git add static/js/vue_data.js static/js/vue_methods.js static/js/renderer.js static/js/locales/zh-CN.js static/js/locales/en-US.js
git commit -m "feat: 前端新增 OpenAIResponses 供应商选项与校验"
```

---

### Task 4: 端到端手动验证

**Files:** 无代码改动

- [ ] **Step 1: 启动应用**

Run: `npm start`
Expected: Electron 窗口打开,后端启动成功(日志出现 `REAL_PORT_FOUND:<port>`)

- [ ] **Step 2: 新增供应商**

设置 → 模型配置 → 服务商,点"+"。左侧供应商列表出现 **OpenAI Responses**;选中后 URL 输入框为空(需手动填写);填 `http://127.0.0.1:3456/v1`(本机后端可作 OpenAPI 兼容测试,或填真实 Responses API 端点)与 API Key,点"测试连接"。
Expected: 不填 URL 时"确认"按钮禁用;填了以 http 开头的 URL 后可用

- [ ] **Step 3: 拉取模型列表**

测试连接后模型列表应显示(若端点无 `/models` 接口则允许手动输入模型名)。

- [ ] **Step 4: 主聊天流式对话**

选该供应商为主模型,发送一条消息。
Expected: 流式输出正常,结束时显示 token 用量(若桥接输出 usage);推理模型可看到思考内容(若端点支持)

- [ ] **Step 5: 工具调用验证**

发送需要工具的消息(如"现在几点"触发时间工具)。
Expected: 工具调用 → 工具结果回传 → 最终回复,链路正常

- [ ] **Step 6: 非流式路径抽测**

用深度搜索或关闭流式输出路径发一条消息(或直接调用 `/v1/chat/completions` 接口,model 填 super-model 且该供应商已选为主模型)。
Expected: 返回完整 JSON 回复

---

## Self-Review 结论

- **Spec 覆盖**:适配器(Task 1)、server.py 两处分发(Task 2)、前端 vendor 列表/URL 处理/校验/翻译(Task 3)、错误处理(适配器异常经现有 `_wrap_client_chat_with_retry` 流程,Task 4 Step 5 实测工具链路)、验证(Task 1 冒烟 + Task 4 手动)— 全部覆盖,无缺口
- **占位符**:无 TBD/TODO,所有代码完整
- **类型一致**:`AsyncResponsesAsOpenAI` 构造签名、`chat.completions.create`、`models.list()` 返回值在 Task 1 定义,Task 2 使用方式(传 `api_key/base_url/http_client`)与 Task 1 签名一致;vendor 字符串 `'OpenAIResponses'` 全计划统一
