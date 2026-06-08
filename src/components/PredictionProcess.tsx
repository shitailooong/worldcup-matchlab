import type {
  ExpectedGoalsEstimate,
  LlmSettings,
  LlmSimulationOutput,
  LlmStatus,
  MatchFixture,
  ModelConfidence,
  SimulationResult,
  TeamProfile,
  UpsetRisk,
} from "../types";
import { getLlmProvider, llmProviders } from "../lib/llmSimulation";

type Props = {
  teamA: TeamProfile;
  teamB: TeamProfile;
  selectedMatch: MatchFixture;
  estimate: ExpectedGoalsEstimate;
  result: SimulationResult;
  keyFactors: string[];
  upsetRisk: UpsetRisk;
  modelConfidence: ModelConfidence;
  goalTempo: "低" | "中" | "高";
  lastRunLabel: string;
  llmSettings: LlmSettings;
  llmPrediction: LlmSimulationOutput | null;
  llmStatus: LlmStatus;
  llmError: string;
  onLlmSettingsChange: (settings: LlmSettings) => void;
  onRun: () => void | Promise<void>;
};

type DimensionRow = {
  label: string;
  teamAValue: number;
  teamBValue: number;
  note: string;
};

export function PredictionProcess({
  teamA,
  teamB,
  selectedMatch,
  estimate,
  result,
  keyFactors,
  upsetRisk,
  modelConfidence,
  goalTempo,
  lastRunLabel,
  llmSettings,
  llmPrediction,
  llmStatus,
  llmError,
  onLlmSettingsChange,
  onRun,
}: Props) {
  const topScore = llmPrediction?.mostLikelyScore ?? result.mostCommonScores[0]?.score ?? "1-1";
  const verdict = llmPrediction?.verdict ?? getVerdict(teamA, teamB, result, topScore);
  const displayed = {
    teamAWinProbability: llmPrediction?.teamAWinProbability ?? result.teamAWinProbability,
    drawProbability: llmPrediction?.drawProbability ?? result.drawProbability,
    teamBWinProbability: llmPrediction?.teamBWinProbability ?? result.teamBWinProbability,
    expectedGoalsA: llmPrediction?.expectedGoalsA ?? estimate.lambdaA,
    expectedGoalsB: llmPrediction?.expectedGoalsB ?? estimate.lambdaB,
    goalTempo: llmPrediction?.goalTempo ?? goalTempo,
    upsetRisk: llmPrediction?.upsetRisk ?? upsetRisk,
    modelConfidence: llmPrediction?.modelConfidence ?? modelConfidence,
    processSteps: llmPrediction?.processSteps ?? getProcessSteps(teamA, teamB, estimate, result, topScore),
    keyFactors: llmPrediction?.keyFactors ?? keyFactors,
  };
  const dimensions = getDimensions(teamA, teamB);
  const currentProvider = getLlmProvider(llmSettings.providerId);
  const adjustedTeams = [teamA, teamB].filter((team) => team.notes.includes("已应用自定义种子参数"));

  function changeProvider(providerId: string) {
    const nextProvider = getLlmProvider(providerId);
    onLlmSettingsChange({
      ...llmSettings,
      providerId: nextProvider.id,
      model: nextProvider.models[0],
    });
  }

  return (
    <section className="card prediction-process-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Prediction Flow</p>
          <h2>多维度预测过程</h2>
        </div>
        <span>{lastRunLabel === "尚未模拟" ? "自动预览" : `已模拟 ${lastRunLabel}`}</span>
      </div>

      <div className="llm-settings-card">
        <div className="llm-switch-row">
          <div>
            <strong>用户自己的大模型 API</strong>
            <p>Key 保存在当前浏览器；预测时经本站代理转发到所选服务商。</p>
          </div>
          <label className="llm-toggle">
            <input
              checked={llmSettings.enabled}
              type="checkbox"
              onChange={(event) => onLlmSettingsChange({ ...llmSettings, enabled: event.target.checked })}
            />
            <span>{llmSettings.enabled ? "已开启" : "未开启"}</span>
          </label>
        </div>

        {llmSettings.enabled && (
          <div className="llm-form-grid">
            <label>
              服务商
              <select value={currentProvider.id} onChange={(event) => changeProvider(event.target.value)}>
                {llmProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              模型
              <select
                value={currentProvider.models.includes(llmSettings.model) ? llmSettings.model : currentProvider.models[0]}
                onChange={(event) => onLlmSettingsChange({ ...llmSettings, model: event.target.value })}
              >
                {currentProvider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <label className="llm-key-field">
              API Key
              <input
                autoComplete="off"
                placeholder="粘贴用户自己的 Key"
                type="password"
                value={llmSettings.apiKey}
                onChange={(event) => onLlmSettingsChange({ ...llmSettings, apiKey: event.target.value })}
              />
            </label>
            <p className="llm-provider-meta">
              接口地址：{currentProvider.baseUrl}
              {currentProvider.id === "xiaomi" ? "（连不上会自动切换备用域名）" : ""} ·
              <a href={currentProvider.docsUrl} rel="noreferrer" target="_blank">
                官方文档
              </a>
            </p>
          </div>
        )}

        {llmSettings.enabled && llmStatus === "success" && (
          <p className="llm-status success">已使用用户自己的大模型生成本次预测。</p>
        )}
        {llmSettings.enabled && llmStatus === "error" && <p className="llm-status error">{llmError}</p>}
      </div>

      <div className="process-hero">
        <div>
          <p>{getStageLabel(selectedMatch)} · 第 {selectedMatch.matchday || "-"} 轮</p>
          <h2>
            {teamA.flagEmoji} {teamA.name} vs {teamB.flagEmoji} {teamB.name}
          </h2>
          {adjustedTeams.length > 0 && (
            <div className="seed-applied-row">
              {adjustedTeams.map((team) => (
                <span key={team.id}>{team.name}已应用自定义种子</span>
              ))}
            </div>
          )}
          <strong>{verdict}</strong>
        </div>
        <button className="simulate-button" disabled={llmStatus === "running"} type="button" onClick={onRun}>
          {llmStatus === "running" ? "大模型预测中..." : llmSettings.enabled ? "用大模型预测" : "重新跑一遍预测"}
        </button>
      </div>

      <div className="process-result-grid">
        <ProbabilityBlock label={`${teamA.name}胜`} value={displayed.teamAWinProbability} />
        <ProbabilityBlock label="平局" value={displayed.drawProbability} />
        <ProbabilityBlock label={`${teamB.name}胜`} value={displayed.teamBWinProbability} />
      </div>

      <div className="process-mini-stats">
        <MiniStat label={`${teamA.name}预期进球`} value={displayed.expectedGoalsA.toFixed(2)} />
        <MiniStat label={`${teamB.name}预期进球`} value={displayed.expectedGoalsB.toFixed(2)} />
        <MiniStat label="最可能比分" value={topScore} />
        <MiniStat label="大比分倾向" value={displayed.goalTempo} />
        <MiniStat label="爆冷风险" value={displayed.upsetRisk} />
        <MiniStat label="模型信心" value={displayed.modelConfidence} />
      </div>

      <div className="process-section">
        <div className="process-section-title">
          <span>01</span>
          <h3>输入的多维度信息</h3>
        </div>
        <div className="dimension-list">
          {dimensions.map((dimension) => (
            <DimensionCompare key={dimension.label} dimension={dimension} teamA={teamA} teamB={teamB} />
          ))}
        </div>
      </div>

      <div className="process-section">
        <div className="process-section-title">
          <span>02</span>
          <h3>模型推演步骤</h3>
        </div>
        <div className="process-timeline">
          {displayed.processSteps.map((step, index) => (
            <article className="process-step" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="process-section">
        <div className="process-section-title">
          <span>03</span>
          <h3>关键判断依据</h3>
        </div>
        <ol className="process-factor-list">
          {displayed.keyFactors.slice(0, 5).map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProbabilityBlock({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="process-probability">
      <span>{label}</span>
      <strong>{percent}%</strong>
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="process-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DimensionCompare({
  dimension,
  teamA,
  teamB,
}: {
  dimension: DimensionRow;
  teamA: TeamProfile;
  teamB: TeamProfile;
}) {
  const winner =
    Math.abs(dimension.teamAValue - dimension.teamBValue) < 2
      ? "接近"
      : dimension.teamAValue > dimension.teamBValue
        ? teamA.name
        : teamB.name;

  return (
    <article className="dimension-row">
      <div className="dimension-meta">
        <strong>{dimension.label}</strong>
        <span>{winner}</span>
      </div>
      <div className="dimension-bars">
        <TeamBar label={teamA.name} value={dimension.teamAValue} />
        <TeamBar label={teamB.name} value={dimension.teamBValue} />
      </div>
      <p>{dimension.note}</p>
    </article>
  );
}

function TeamBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="dimension-bar">
      <span>{label}</span>
      <div>
        <i style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
      <strong>{Math.round(value)}</strong>
    </div>
  );
}

function getDimensions(teamA: TeamProfile, teamB: TeamProfile): DimensionRow[] {
  return [
    {
      label: "基础实力",
      teamAValue: teamA.overallStrength,
      teamBValue: teamB.overallStrength,
      note: "先看双方整体强度，决定比赛预测的基础盘。",
    },
    {
      label: "近期状态",
      teamAValue: teamA.recentForm,
      teamBValue: teamB.recentForm,
      note: "状态用于修正基础实力，避免只看纸面阵容。",
    },
    {
      label: "进攻破防",
      teamAValue: clamp(50 + (teamA.attackPower - teamB.defensePower) / 2, 0, 100),
      teamBValue: clamp(50 + (teamB.attackPower - teamA.defensePower) / 2, 0, 100),
      note: "进攻能力减去对手防守强度，估算常规进攻能否打穿。",
    },
    {
      label: "中场控制",
      teamAValue: teamA.midfieldControl,
      teamBValue: teamB.midfieldControl,
      note: "中场控制影响控球持续性、二点球和压迫后的回收。",
    },
    {
      label: "反击空间",
      teamAValue: clamp(50 + (teamA.counterAttack - teamB.defensiveLineHeight) / 2, 0, 100),
      teamBValue: clamp(50 + (teamB.counterAttack - teamA.defensiveLineHeight) / 2, 0, 100),
      note: "反击速度与对手防线高度形成对位，决定身后空间风险。",
    },
    {
      label: "定位球机会",
      teamAValue: clamp(50 + (teamA.setPieceAttack - teamB.setPieceDefense) / 2, 0, 100),
      teamBValue: clamp(50 + (teamB.setPieceAttack - teamA.setPieceDefense) / 2, 0, 100),
      note: "定位球在强强对话里容易放大小比分差距。",
    },
    {
      label: "防守门将",
      teamAValue: (teamA.defensePower + teamA.goalkeeper) / 2,
      teamBValue: (teamB.defensePower + teamB.goalkeeper) / 2,
      note: "防线与门将共同决定对方射门转化率。",
    },
    {
      label: "稳定性",
      teamAValue: clamp(100 - (teamA.injuryImpact + teamA.fatigue) / 2, 0, 100),
      teamBValue: clamp(100 - (teamB.injuryImpact + teamB.fatigue) / 2, 0, 100),
      note: "伤停和疲劳越高，稳定性越低，后程波动越大。",
    },
  ];
}

function getProcessSteps(
  teamA: TeamProfile,
  teamB: TeamProfile,
  estimate: ExpectedGoalsEstimate,
  result: SimulationResult,
  topScore: string,
) {
  const ratingLeader = getLeaderText(teamA.name, teamB.name, estimate.ratingA, estimate.ratingB);
  const xgLeader = getLeaderText(teamA.name, teamB.name, estimate.lambdaA, estimate.lambdaB);
  const tacticalLeader = getLeaderText(
    teamA.name,
    teamB.name,
    estimate.tacticalModifierA,
    estimate.tacticalModifierB,
  );
  const riskA = teamA.injuryImpact + teamA.fatigue;
  const riskB = teamB.injuryImpact + teamB.fatigue;
  const riskText =
    Math.abs(riskA - riskB) < 4
      ? "双方伤停和体能风险接近，模型不会给某一方大幅扣分。"
      : riskA < riskB
        ? `${teamA.name}稳定性更好，后程掉速风险低于${teamB.name}。`
        : `${teamB.name}稳定性更好，后程掉速风险低于${teamA.name}。`;

  return [
    {
      title: "基础盘计算",
      body: `综合实力、状态、攻防和阵容深度合成基础评分：${teamA.name} ${estimate.ratingA.toFixed(1)}，${teamB.name} ${estimate.ratingB.toFixed(1)}。${ratingLeader}`,
    },
    {
      title: "机会质量估算",
      body: `把进攻能力、对手防守、中场控制和门将压制转成预期进球：${teamA.name} ${estimate.lambdaA.toFixed(2)}，${teamB.name} ${estimate.lambdaB.toFixed(2)}。${xgLeader}`,
    },
    {
      title: "战术对位修正",
      body: `反击、防线高度、压迫出球、定位球会形成战术修正：${teamA.name} ${formatSigned(estimate.tacticalModifierA)}，${teamB.name} ${formatSigned(estimate.tacticalModifierB)}。${tacticalLeader}`,
    },
    {
      title: "稳定性扣分",
      body: riskText,
    },
    {
      title: "概率分布输出",
      body: `用当前预期进球进行比分分布模拟，得到胜平负概率。最常见比分是 ${topScore}，双方进球概率约 ${Math.round(result.bothTeamsScoreProbability * 100)}%。`,
    },
  ];
}

function getVerdict(teamA: TeamProfile, teamB: TeamProfile, result: SimulationResult, topScore: string): string {
  const values = [
    { label: `${teamA.name}胜`, team: teamA.name, value: result.teamAWinProbability },
    { label: "平局", team: "平局", value: result.drawProbability },
    { label: `${teamB.name}胜`, team: teamB.name, value: result.teamBWinProbability },
  ].sort((a, b) => b.value - a.value);
  const gap = values[0].value - values[1].value;
  const strength = gap < 0.06 ? "非常接近" : gap < 0.14 ? "小幅倾向" : "明显倾向";

  if (values[0].team === "平局") return `模型认为这场更像细节局，最常见比分 ${topScore}。`;
  return `${strength}${values[0].label}走势，最常见比分 ${topScore}。`;
}

function getLeaderText(nameA: string, nameB: string, valueA: number, valueB: number): string {
  const gap = Math.abs(valueA - valueB);
  if (gap < 0.04 || gap < Math.max(valueA, valueB) * 0.03) return "双方差距不大。";
  return valueA > valueB ? `${nameA}略占上风。` : `${nameB}略占上风。`;
}

function getStageLabel(match: MatchFixture): string {
  if (match.type === "group") return `${match.group}组`;
  const normalized = match.type.toLowerCase();
  if (normalized.includes("32")) return "32强";
  if (normalized.includes("16")) return "16强";
  if (normalized.includes("quarter")) return "1/4决赛";
  if (normalized.includes("semi")) return "半决赛";
  if (normalized.includes("third")) return "三四名";
  if (normalized.includes("final")) return "决赛";
  return match.type;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
