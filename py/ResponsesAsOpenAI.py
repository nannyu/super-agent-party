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

                get_kwargs = {"headers": headers}
                if self._parent.timeout is not None:
                    get_kwargs["timeout"] = self._parent.timeout

                try:
                    response = await client.get(url, **get_kwargs)
                finally:
                    # 本地创建的客户端无论成功/异常都必须关闭，避免连接泄漏
                    if need_close:
                        await client.aclose()

                if response.status_code == 200:
                    data = response.json()
                    models = [ModelItem(m["id"]) for m in data.get("data", [])]
                    if models:
                        return ModelList(models)
                else:
                    print(f"获取 OpenAI Responses 模型列表失败: HTTP {response.status_code}")
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
