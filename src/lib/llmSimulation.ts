import type {
  ExpectedGoalsEstimate,
  LlmSettings,
  LlmSimulationOutput,
  MatchContext,
  MatchFixture,
  SimulationResult,
  TeamProfile,
} from "../types";

type LlmRequestInput = {
  match: MatchFixture;
  teamA: TeamProfile;
  teamB: TeamProfile;
  estimate: ExpectedGoalsEstimate;
  localResult: SimulationResult;
  keyFactors: string[];
  context: MatchContext;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type LlmProviderOption = {
  id: string;
  name: string;
  baseUrl: string;
  docsUrl: string;
  models: string[];
};

export const llmProviders: LlmProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/docs/api-reference/chat/create",
    models: ["gpt-4.1-mini", "gpt-4o-mini"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    docsUrl: "https://api-docs.deepseek.com/",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
  {
    id: "xiaomi",
    name: "小米 MiMo",
    baseUrl: "https://api.mimo-v2.com/v1",
    docsUrl: "https://www.mimo-v2.com/zh/docs/api/chat/openai-api",
    models: ["mimo-v2.5-pro", "mimo-v2.5", "mimo-v2-pro", "mimo-v2-omni"],
  },
  {
    id: "qwen",
    name: "通义千问 / 阿里百炼",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    docsUrl: "https://help.aliyun.com/zh/model-studio/use-qwen-by-calling-api",
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
  },
  {
    id: "kimi",
    name: "Kimi / Moonshot",
    baseUrl: "https://api.moonshot.ai/v1",
    docsUrl: "https://platform.kimi.ai/docs/api/overview",
    models: ["kimi-k2.6", "kimi-k2", "moonshot-v1-8k"],
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
    models: ["glm-5.1", "glm-4.7", "glm-4"],
  },
  {
    id: "volcengine",
    name: "火山方舟 / Doubao",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    docsUrl: "https://www.volcengine.com/docs/82379/1330626",
    models: ["doubao-seed-1-6-251015", "doubao-seed-1-6-flash-250828"],
  },
  {
    id: "siliconflow",
    name: "硅基流动",
    baseUrl: "https://api.siliconflow.cn/v1",
    docsUrl: "https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions",
    models: ["Pro/zai-org/GLM-4.7", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-32B"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/docs/api/reference/overview",
    models: ["openai/gpt-4.1-mini", "xiaomi/mimo-v2.5-pro", "deepseek/deepseek-v4-flash"],
  },
];

export const defaultLlmSettings: LlmSettings = {
  enabled: false,
  providerId: "xiaomi",
  model: "mimo-v2.5-pro",
  apiKey: "",
};

export async function requestLlmSimulation(
  settings: LlmSettings,
  input: LlmRequestInput,
): Promise<LlmSimulationOutput> {
  if (!settings.enabled) throw new Error("请先开启大模型预测。");
  const provider = getLlmProvider(settings.providerId);
  if (!settings.apiKey.trim()) throw new Error("请先填写你自己的 API Key。");
  if (!settings.model.trim()) throw new Error("请先选择模型。");

  const messages = buildMessages(input);
  const content = await callChatCompletions(provider, settings, messages, true).catch(async (error) => {
    if (!isJsonModeError(error)) throw error;
    return callChatCompletions(provider, settings, messages, false);
  });
  return normalizeLlmOutput(parseJsonObject(content), input);
}

export function getLlmProvider(providerId: string): LlmProviderOption {
  return llmProviders.find((provider) => provider.id === providerId) ?? llmProviders[0];
}

function buildMessages(input: LlmRequestInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "你是足球数据建模分析师。你只做比赛走势模拟和解释，不提供投注建议。你必须只返回 JSON，不要 Markdown，不要额外解释。",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "基于赛程、球队 mock 数据、本地泊松模型基线，给出一份适合普通用户阅读的世界杯比赛大模型预测。",
        output_schema: {
          verdict: "一句话结论，中文，避免投注语气",
          teamAWinProbability: "0-1 小数",
          drawProbability: "0-1 小数",
          teamBWinProbability: "0-1 小数",
          expectedGoalsA: "数字",
          expectedGoalsB: "数字",
          mostLikelyScore: "例如 1-1",
          goalTempo: "低/中/高",
          upsetRisk: "低/中/高",
          modelConfidence: "低/中/高",
          processSteps: [
            { title: "基础盘计算", body: "这一步怎么判断" },
            { title: "机会质量估算", body: "这一步怎么判断" },
            { title: "战术对位修正", body: "这一步怎么判断" },
            { title: "稳定性扣分", body: "这一步怎么判断" },
            { title: "概率分布输出", body: "这一步怎么判断" },
          ],
          keyFactors: ["关键因素 1", "关键因素 2", "关键因素 3", "关键因素 4", "关键因素 5"],
        },
        constraints: [
          "不要声称这是官方预测或真实数据",
          "不要出现赌球、赔率、投注建议",
          "概率三项相加必须接近 1",
          "解释要像产品里的预测过程，不要写成长文章",
          "必须结合双方具体指标差异，而不是泛泛而谈",
        ],
        match: input.match,
        teamA: input.teamA,
        teamB: input.teamB,
        local_baseline: {
          estimate: input.estimate,
          monteCarlo: input.localResult,
          keyFactors: input.keyFactors,
          context: input.context,
        },
      }),
    },
  ];
}

async function callChatCompletions(
  provider: LlmProviderOption,
  settings: LlmSettings,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
  const response = await fetch("./api/llm-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      providerId: provider.id,
      apiKey: settings.apiKey,
      model: provider.models.includes(settings.model) ? settings.model : provider.models[0],
      messages,
      temperature: 0.35,
      jsonMode,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(formatProxyError(response.status, text));
  }

  const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("大模型没有返回可解析内容。");
  return content;
}

function formatProxyError(status: number, text: string): string {
  try {
    const data = JSON.parse(text) as { error?: unknown; message?: unknown };
    if (typeof data.error === "string") return data.error;
    if (isRecord(data.error) && typeof data.error.message === "string") return data.error.message;
    if (typeof data.message === "string") return data.message;
  } catch {
    // Keep the raw text fallback below.
  }
  if (status === 404) return "当前部署没有启用大模型代理，请使用 npm run dev 本地运行，或部署到 Vercel。";
  return `大模型接口返回 ${status}：${text.slice(0, 220)}`;
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("大模型返回内容不是 JSON。");
    return JSON.parse(match[0]);
  }
}

function normalizeLlmOutput(raw: unknown, input: LlmRequestInput): LlmSimulationOutput {
  const value = isRecord(raw) ? raw : {};
  const probabilities = normalizeProbabilities(
    toProbability(value.teamAWinProbability, input.localResult.teamAWinProbability),
    toProbability(value.drawProbability, input.localResult.drawProbability),
    toProbability(value.teamBWinProbability, input.localResult.teamBWinProbability),
  );

  return {
    verdict: toText(value.verdict, getFallbackVerdict(input)),
    teamAWinProbability: probabilities[0],
    drawProbability: probabilities[1],
    teamBWinProbability: probabilities[2],
    expectedGoalsA: clampNumber(value.expectedGoalsA, input.estimate.lambdaA, 0.2, 4.5),
    expectedGoalsB: clampNumber(value.expectedGoalsB, input.estimate.lambdaB, 0.2, 4.5),
    mostLikelyScore: toText(value.mostLikelyScore, input.localResult.mostCommonScores[0]?.score || "1-1"),
    goalTempo: toLevel(value.goalTempo, "中"),
    upsetRisk: toLevel(value.upsetRisk, "中"),
    modelConfidence: toLevel(value.modelConfidence, "中"),
    processSteps: normalizeSteps(value.processSteps, input),
    keyFactors: normalizeStringList(value.keyFactors, input.keyFactors, 5),
  };
}

function normalizeSteps(value: unknown, input: LlmRequestInput): LlmSimulationOutput["processSteps"] {
  if (Array.isArray(value)) {
    const steps = value
      .map((item) => {
        if (!isRecord(item)) return null;
        const title = toText(item.title, "");
        const body = toText(item.body, "");
        return title && body ? { title, body } : null;
      })
      .filter(Boolean) as LlmSimulationOutput["processSteps"];
    if (steps.length >= 3) return steps.slice(0, 6);
  }

  return [
    {
      title: "基础盘计算",
      body: `本地基线评分为 ${input.teamA.name} ${input.estimate.ratingA.toFixed(1)}，${input.teamB.name} ${input.estimate.ratingB.toFixed(1)}。`,
    },
    {
      title: "机会质量估算",
      body: `预期进球基线为 ${input.teamA.name} ${input.estimate.lambdaA.toFixed(2)}，${input.teamB.name} ${input.estimate.lambdaB.toFixed(2)}。`,
    },
    {
      title: "概率分布输出",
      body: `本地模型最常见比分是 ${input.localResult.mostCommonScores[0]?.score || "1-1"}。`,
    },
  ];
}

function normalizeStringList(value: unknown, fallback: string[], maxLength: number): string[] {
  if (Array.isArray(value)) {
    const items = value.map((item) => toText(item, "")).filter(Boolean);
    if (items.length) return items.slice(0, maxLength);
  }
  return fallback.slice(0, maxLength);
}

function normalizeProbabilities(a: number, draw: number, b: number): [number, number, number] {
  const total = a + draw + b;
  if (total <= 0) return [0.34, 0.32, 0.34];
  return [a / total, draw / total, b / total];
}

function toProbability(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  const normalized = numberValue > 1 ? numberValue / 100 : numberValue;
  return clamp(normalized, 0.01, 0.98);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return clamp(numberValue, min, max);
}

function toLevel(value: unknown, fallback: "低" | "中" | "高"): "低" | "中" | "高" {
  return value === "低" || value === "中" || value === "高" ? value : fallback;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJsonModeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /response_format|json_object|400|unsupported/i.test(message);
}

function getFallbackVerdict(input: LlmRequestInput): string {
  const topScore = input.localResult.mostCommonScores[0]?.score || "1-1";
  if (input.localResult.drawProbability > 0.3) return `本地基线认为这场更像细节局，常见比分 ${topScore}。`;
  return `本地基线认为双方存在小幅倾向，常见比分 ${topScore}。`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
