# OpenAI Responses API 模型提供商接入设计

日期: 2026-07-31
状态: 已确认

## 背景与目标

为模型提供商新增一个独立 vendor 类型,用于接入只提供 **OpenAI Responses API** 端点(`POST /responses`)的服务商,包括:

1. 某些中转站/网关只实现了 `/responses` 端点,没有 Chat Completions 端点
2. 官方 OpenAI 的 gpt-5/o3 等模型的新能力(如 reasoning 摘要、内置 web_search)依赖 Responses API

实现要求:使用项目已有的 **litellm** 依赖(litellm>=1.83.7,当前锁定 1.83.13)。

## 技术背景

litellm 1.83.13 内置 `responses_api_bridge`(`litellm/completion_extras/litellm_responses_transformation/`),当 `litellm.acompletion(model="openai/responses/<model>", ...)` 时自动:

> **注意:必须带 `openai/` 路由前缀。** litellm 1.83.13 的 `get_llm_provider` 无法解析裸 `responses/<model>` 的 provider(抛 BadRequestError);`openai/responses/<model>` 会先按 `openai/` 解析出 provider,路径剥成 `responses/<model>` 后命中 `responses_api_bridge`。

- 将 Chat Completions 请求转换为 Responses API 请求(`messages` → `input` items,含 tool 结果消息 → `function_call_output`)
- `tools` 自动转换为 Responses 格式(`{type: "function", name, description, parameters}`)
- `max_tokens`/`max_completion_tokens` → `max_output_tokens`
- `response_format` → `text.format`;`reasoning_effort` → `reasoning`
- `web_search_options` → 内置 web_search 工具
- 将 Responses API 响应转回 Chat Completions 格式:非流式 `ModelResponse`(含 `choices[0].message.tool_calls`、`usage`);流式 `CustomStreamWrapper` 产出标准 chat.completions 块(含 `delta.reasoning_content`、tool_calls、末尾 usage 块)

已验证(本机 `.venv` 中 litellm 1.83.13):`litellm.responses`/`aresponses` 存在,桥接 handler 与转换逻辑存在。

## 架构决策

### 方案选择

选 **方案 A:新适配器 + 新 vendor,走 litellm `openai/responses/` 前缀桥接**。

- 方案 A:新建 `py/ResponsesAsOpenAI.py` 模拟 AsyncOpenAI 接口,内部 `litellm.acompletion(model="openai/responses/<model>", ...)`。代码量小(~150 行),格式转换全部由 litellm 维护,主聊天/推理/深度搜索/`/v1/chat/completions` 所有路径自动生效
- 方案 B(弃):直接用 `litellm.aresponses()` 并在适配器内自行转换消息/工具/流格式,代码量 3-4 倍且易出兼容 bug
- 方案 C(弃):改造现有 `custom` vendor 加开关,与现有 customAnthropic 模式不一致

### 架构图

```
前端选择 vendor "OpenAIResponses" → 设置保存 (modelProviders[])
    ↓
server.py get_client_class() 分发 → AsyncResponsesAsOpenAI (py/ResponsesAsOpenAI.py)
    ↓ 模拟 AsyncOpenAI 接口 (chat.completions.create / models.list)
    ↓
litellm.acompletion(model="openai/responses/<model>", api_base=url, ...)
    ↓ responses_api_bridge
    ↓
litellm.aresponses() → POST {base}/responses
    ↓ 桥接转回 chat.completions 格式 (流式/非流式)
    ↓
现有 generate_stream_response / generate_complete_response 零改动
```

## 实现细节

### 1. 后端:新文件 `py/ResponsesAsOpenAI.py`

类 `AsyncResponsesAsOpenAI`,仿照 `py/ClaudeAsOpenAI.py` 模式:

- `__init__(api_key, base_url=None, default_model=None, http_client=None, timeout=None, max_retries=None, **kwargs)` — 签名与 `AsyncClaudeAsOpenAI` 一致
- `_litellm` 属性:懒加载 `import litellm` 并缓存
- `chat.completions.create(model, messages, temperature, max_tokens, stream, top_p, stop, tools, tool_choice, **kwargs)`:
  - model 前缀 `openai/responses/`(未带前缀时补全;`responses/x` 输入先改写为 `openai/responses/x`,litellm 剥掉 `openai/` 后按 `responses/` 触发桥接)
  - 组装 kwargs:`model`、`messages`、`api_key`、`api_base=base_url`、`stream`、`temperature`、`max_tokens`、`top_p`、`stop`、`timeout`、`client=http_client`(复用全局代理客户端)
  - `tools`、`tool_choice` 原样透传(桥接自动转换)
  - 过滤 kwargs 中 `logprobs`、`top_logprobs`、`n` 三个桥接不支持的参数,其余(含 `response_format`、`reasoning_effort`)透传
  - `return await litellm.acompletion(**completion_kwargs, **safe_kwargs)`
- `models.list()`:`GET {base}/models`(base_url 以 `/v1` 结尾则直接拼 `/models`,否则拼 `/v1/models`),Bearer 认证,复用全局 http_client;失败打印警告并返回空列表兜底

### 2. 后端分发点 `server.py`

| 位置 | 改动 |
|---|---|
| `get_client_class()` 731-748 行 | 新增 `if vendor == 'OpenAIResponses': return AsyncResponsesAsOpenAI`;import `py/ResponsesAsOpenAI.py`(471-473 行附近) |
| `/v1/providers/models` 7043-7072 行 | vendor 分发处新增 `OpenAIResponses` → 新适配器实例,拉取模型列表 |

### 3. 前端改动

| 文件 | 改动 |
|---|---|
| `static/js/vue_data.js` 1943 行 `vendorValues` | 在 `'customAnthropic'` 后新增 `'OpenAIResponses'` |
| `static/js/vue_methods.js` `handleVendorChange` 5596 行 | `value !== 'custom' && value !== 'customAnthropic'` 改为同时排除 `'OpenAIResponses'`(不预填默认 URL,由用户填端点) |
| `static/js/vue_methods.js` `goToURL` 8596 行 | `customAnthropic` 分支同样处理 `OpenAIResponses`(打开用户填的 URL 作为 API 页) |
| `static/js/renderer.js` `validProvider` 2011 行 | `custom`/`customAnthropic` 分支加入 `'OpenAIResponses'`(需以 http 开头的 URL 才有效) |

### 4. 错误处理

- 网关不支持 Responses 端点时,litellm 桥接抛异常 → `_wrap_client_chat_with_retry`(751-784 行)按现有策略重试 429/5xx → 走现有错误上报流程,前端显示错误信息
- 模型列表拉取失败 → 空列表,前端可手动输入模型名

### 5. 验证方式

无自动化测试(项目现状),手动验证:

1. 设置页新增供应商,选 `OpenAIResponses` vendor,填中转站 URL + API Key
2. 点"测试连接",确认模型列表能拉取或可手动输入
3. 主聊天发送消息,确认流式输出正常(含 reasoning 模型时确认思考内容展示)
4. 开启工具调用的对话,确认工具调用/工具结果回传正常
5. 非流式路径(如深度搜索)抽测一轮

## 范围

不做:

- 不改现有 OpenAI/其他 vendor 行为
- 不新增 Responses API 特有 UI(如 reasoning 展示开关)
- 不升级 litellm 版本(1.83.13 已含桥接)

依赖:litellm>=1.83.7(已满足,当前 1.83.13,无需改 pyproject.toml)
