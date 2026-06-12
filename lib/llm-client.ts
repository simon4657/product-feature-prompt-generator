import type { LLMProvider } from "@/types/prompt-generator";

export type LLMRequest = {
  provider: LLMProvider;
  apiKey: string;
  modelName: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: "text" | "json";
  timeoutMs?: number;
  maxOutputTokens?: number;
};

export type LLMResponse = {
  content: string;
  raw?: unknown;
};

const DEFAULT_BASE_URLS: Record<LLMProvider, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  kimi: "https://api.moonshot.cn/v1"
};

type ProviderErrorDetail = {
  code: string;
  message: string;
  combined: string;
};

async function readProviderErrorDetail(response: Response): Promise<ProviderErrorDetail> {
  const text = await response.text();
  let code = "";
  let message = "";
  try {
    const data = JSON.parse(text) as {
      error?: { code?: string; type?: string; message?: string };
      code?: string;
      message?: string;
    };
    code = data.error?.code || data.error?.type || data.code || "";
    message = data.error?.message || data.message || "";
  } catch {
    message = text;
  }
  return {
    code,
    message,
    combined: `${code} ${message}`.toLowerCase()
  };
}

function isRateLimitError(detail: ProviderErrorDetail) {
  return /rate.?limit|too many requests|rpm|tpm|throttl|频繁|限流/.test(detail.combined);
}

function isQuotaError(detail: ProviderErrorDetail) {
  return !isRateLimitError(detail)
    && /insufficient|quota|balance|credit|billing|余额|餘額|额度|額度/.test(detail.combined);
}

function isContextError(detail: ProviderErrorDetail) {
  return /context|maximum.*length|too many tokens|上下文|长度|長度/.test(detail.combined);
}

function providerError(status: number, provider: LLMProvider, detail: ProviderErrorDetail) {
  if (status === 401 || status === 403) return "API Key 無效或權限不足。";
  if (status === 404) return "模型名稱或 API Endpoint 不存在。";
  if (status === 429 && provider === "kimi" && isQuotaError(detail)) {
    return "Kimi API 帳戶餘額或額度不足，請至 Moonshot 開放平台確認帳戶餘額。";
  }
  if (status === 429 && provider === "kimi") {
    return "Kimi API 仍處於速率限制，系統已等待並重試 2 次。請稍候 30 至 60 秒後再試。";
  }
  if (status === 429) return "API 額度不足或請求過於頻繁。";
  if (status === 400 && provider === "kimi" && isContextError(detail)) {
    return "Kimi 收到的企劃內容過長，請縮短商品資料或減少單次生成張數。";
  }
  if (status === 400 && provider === "kimi") return "Kimi 拒絕了請求參數，請確認模型可用後再試。";
  if (status === 400 && provider === "gemini") return "Gemini 拒絕了請求，請確認模型是否已對此 API Key 開放。";
  if (status === 400 && provider === "openai") return "OpenAI 拒絕了請求，請確認模型是否已對此專案開放。";
  if (status >= 500) return "模型服務暫時無法使用，請稍後再試。";
  return `模型服務請求失敗 (${status})。`;
}

function retryDelayMs(response: Response, attempt: number) {
  const retryAfterValue = response.headers.get("retry-after");
  if (retryAfterValue) {
    const retryAfterSeconds = Number(retryAfterValue);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, 30000);
    }
    const retryAt = Date.parse(retryAfterValue);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(retryAt - Date.now(), 1000), 30000);
    }
  }
  return attempt === 0 ? 10000 : 20000;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("LLM 回應逾時，請稍後再試。");
    throw new Error("無法連線至模型服務。");
  } finally {
    clearTimeout(timeout);
  }
}

function extractOpenAIText(data: {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  if (data.output_text?.trim()) return data.output_text.trim();
  return (data.output || [])
    .filter((item) => !item.type || item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((item) => !item.type || item.type === "output_text")
    .map((item) => item.text || "")
    .join("")
    .trim();
}

function openAIEmptyResponseError(data: {
  status?: string;
  incomplete_details?: { reason?: string };
}) {
  if (data.status === "incomplete" || data.incomplete_details?.reason === "max_output_tokens") {
    return "OpenAI 在產生內容前已用完輸出額度，請重新生成。";
  }
  return "OpenAI 沒有回傳可用內容，請重新生成。";
}

async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const isGpt5 = /^gpt-5(?:[.-]|$)/i.test(request.modelName);
  const response = await fetchWithTimeout(`${DEFAULT_BASE_URLS.openai}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`
    },
    body: JSON.stringify({
      model: request.modelName,
      instructions: request.systemPrompt,
      input: request.userPrompt,
      store: false,
      max_output_tokens: request.maxOutputTokens ?? 6000,
      reasoning: isGpt5 ? { effort: "minimal" } : undefined,
      text: request.responseFormat === "json"
        ? { format: { type: "json_object" } }
        : undefined
    })
  }, request.timeoutMs);
  if (!response.ok) {
    const detail = await readProviderErrorDetail(response);
    throw new Error(providerError(response.status, "openai", detail));
  }
  const data = await response.json() as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
    status?: string;
    incomplete_details?: { reason?: string };
  };
  const content = extractOpenAIText(data);
  if (!content) throw new Error(openAIEmptyResponseError(data));
  return { content, raw: data };
}

function geminiThinkingConfig(modelName: string) {
  if (/^gemini-3/i.test(modelName)) {
    return { thinkingLevel: /pro/i.test(modelName) ? "low" : "minimal" };
  }
  if (/^gemini-2\.5-flash/i.test(modelName)) return { thinkingBudget: 0 };
  if (/^gemini-2\.5-pro/i.test(modelName)) return { thinkingBudget: 512 };
  return undefined;
}

function geminiEmptyResponseError(data: {
  candidates?: Array<{ finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}) {
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") {
    return "Gemini 在產生內容前已用完輸出額度，請重新生成。";
  }
  if (finishReason && finishReason !== "STOP") {
    return `Gemini 未產生內容，停止原因：${finishReason}。`;
  }
  if (data.promptFeedback?.blockReason) {
    return `Gemini 未產生內容，封鎖原因：${data.promptFeedback.blockReason}。`;
  }
  return "Gemini 沒有回傳可用內容，請重新生成。";
}

async function callGemini(request: LLMRequest): Promise<LLMResponse> {
  const model = encodeURIComponent(request.modelName);
  const response = await fetchWithTimeout(`${DEFAULT_BASE_URLS.gemini}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": request.apiKey
    },
    body: JSON.stringify({
      systemInstruction: request.systemPrompt ? { parts: [{ text: request.systemPrompt }] } : undefined,
      contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        responseMimeType: request.responseFormat === "json" ? "application/json" : "text/plain",
        maxOutputTokens: request.maxOutputTokens ?? 6000,
        thinkingConfig: geminiThinkingConfig(request.modelName)
      }
    })
  }, request.timeoutMs);
  if (!response.ok) {
    const detail = await readProviderErrorDetail(response);
    throw new Error(providerError(response.status, "gemini", detail));
  }
  const data = await response.json() as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
    promptFeedback?: { blockReason?: string };
  };
  const content = data.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text || "")
    .join("")
    .trim();
  if (!content) throw new Error(geminiEmptyResponseError(data));
  return { content, raw: data };
}

async function callKimi(request: LLMRequest): Promise<LLMResponse> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchWithTimeout(`${DEFAULT_BASE_URLS.kimi}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey}`
      },
      body: JSON.stringify({
        model: request.modelName,
        messages: [
          ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
          { role: "user", content: request.userPrompt }
        ],
        thinking: request.modelName === "kimi-k2.5" ? { type: "disabled" } : undefined,
        max_tokens: request.maxOutputTokens ?? 4000,
        response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined
      })
    }, request.timeoutMs);
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Kimi 沒有回傳可用內容。");
      return { content, raw: data };
    }

    const detail = await readProviderErrorDetail(response);
    const shouldRetry = response.status === 429
      && !isQuotaError(detail)
      && attempt < 2;
    if (shouldRetry) {
      await wait(retryDelayMs(response, attempt));
      continue;
    }
    throw new Error(providerError(response.status, "kimi", detail));
  }
  throw new Error("Kimi API 仍處於速率限制，系統已等待並重試 2 次。請稍候 30 至 60 秒後再試。");
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  if (!request.apiKey.trim()) throw new Error("API Key 不可空白。");
  if (!request.modelName.trim()) throw new Error("模型名稱不可空白。");
  if (request.provider === "openai") return callOpenAI(request);
  if (request.provider === "gemini") return callGemini(request);
  return callKimi(request);
}
