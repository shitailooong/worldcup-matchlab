import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

type LlmProxyProvider = {
  baseUrls: string[];
  models: string[];
};

type LlmProxyBody = {
  providerId?: string;
  apiKey?: string;
  model?: string;
  messages?: unknown[];
  temperature?: number;
  jsonMode?: boolean;
};

const llmProxyProviders: Record<string, LlmProxyProvider> = {
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

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "local-llm-proxy",
      configureServer(server) {
        server.middlewares.use("/api/llm-proxy", async (request, response) => {
          if (request.method !== "POST") {
            sendProxyJson(response, 405, { error: "只支持 POST 请求。" });
            return;
          }

          try {
            const body = JSON.parse(await readRequestBody(request)) as LlmProxyBody;
            const provider = body.providerId ? llmProxyProviders[body.providerId] : null;
            if (!provider) {
              sendProxyJson(response, 400, { error: "未知的大模型服务商。" });
              return;
            }
            if (!body.apiKey) {
              sendProxyJson(response, 400, { error: "请先填写你自己的 API Key。" });
              return;
            }
            if (!body.model || !provider.models.includes(body.model)) {
              sendProxyJson(response, 400, { error: "当前服务商不支持这个模型。" });
              return;
            }
            if (!Array.isArray(body.messages)) {
              sendProxyJson(response, 400, { error: "请求消息格式不正确。" });
              return;
            }

            const upstream = await callProviderChat(provider, body);
            const text = await upstream.text();
            response.statusCode = upstream.status;
            response.setHeader("Content-Type", upstream.headers.get("Content-Type") || "application/json");
            response.end(text);
          } catch (error) {
            sendProxyJson(response, 502, {
              error: error instanceof Error ? error.message : "大模型代理请求失败。",
            });
          }
        });
      },
    },
  ],
});

function readRequestBody(request: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function callProviderChat(provider: LlmProxyProvider, body: LlmProxyBody): Promise<Response> {
  let lastError: unknown;
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

function sendProxyJson(
  response: import("node:http").ServerResponse,
  statusCode: number,
  payload: { error: string },
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
