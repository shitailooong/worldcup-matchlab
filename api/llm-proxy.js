const providers = {
  openai: {
    baseUrls: ["https://api.openai.com/v1"],
    models: ["gpt-4.1-mini", "gpt-4o-mini"],
  },
  deepseek: {
    baseUrls: ["https://api.deepseek.com"],
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
  xiaomi: {
    baseUrls: ["https://api.mimo-v2.com/v1", "https://api.xiaomimimo.com/v1"],
    models: ["mimo-v2.5-pro", "mimo-v2.5", "mimo-v2-pro", "mimo-v2-omni"],
  },
  qwen: {
    baseUrls: ["https://dashscope.aliyuncs.com/compatible-mode/v1"],
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
  },
  kimi: {
    baseUrls: ["https://api.moonshot.ai/v1"],
    models: ["kimi-k2.6", "kimi-k2", "moonshot-v1-8k"],
  },
  zhipu: {
    baseUrls: ["https://open.bigmodel.cn/api/paas/v4"],
    models: ["glm-5.1", "glm-4.7", "glm-4"],
  },
  volcengine: {
    baseUrls: ["https://ark.cn-beijing.volces.com/api/v3"],
    models: ["doubao-seed-1-6-251015", "doubao-seed-1-6-flash-250828"],
  },
  siliconflow: {
    baseUrls: ["https://api.siliconflow.cn/v1"],
    models: ["Pro/zai-org/GLM-4.7", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-32B"],
  },
  openrouter: {
    baseUrls: ["https://openrouter.ai/api/v1"],
    models: ["openai/gpt-4.1-mini", "xiaomi/mimo-v2.5-pro", "deepseek/deepseek-v4-flash"],
  },
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "只支持 POST 请求。" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const provider = body.providerId ? providers[body.providerId] : null;
    if (!provider) {
      sendJson(response, 400, { error: "未知的大模型服务商。" });
      return;
    }
    if (!body.apiKey) {
      sendJson(response, 400, { error: "请先填写你自己的 API Key。" });
      return;
    }
    if (!body.model || !provider.models.includes(body.model)) {
      sendJson(response, 400, { error: "当前服务商不支持这个模型。" });
      return;
    }
    if (!Array.isArray(body.messages)) {
      sendJson(response, 400, { error: "请求消息格式不正确。" });
      return;
    }

    const upstream = await callProviderChat(provider, body);

    const text = await upstream.text();
    response.statusCode = upstream.status;
    response.setHeader("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
    response.end(text);
  } catch (error) {
    sendJson(response, 502, { error: error instanceof Error ? error.message : "大模型代理请求失败。" });
  }
}

async function callProviderChat(provider, body) {
  let lastError;
  for (const baseUrl of provider.baseUrls) {
    try {
      return await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${body.apiKey}`,
        },
        body: JSON.stringify({
          model: body.model,
          messages: body.messages,
          temperature: body.temperature ?? 0.35,
          ...(body.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("无法连接到所选大模型服务商。");
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") return JSON.parse(request.body || "{}");

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
