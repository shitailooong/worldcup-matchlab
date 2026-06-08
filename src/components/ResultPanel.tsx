import type {
  ExpectedGoalsEstimate,
  ModelConfidence,
  SimulationResult,
  TeamProfile,
  UpsetRisk,
} from "../types";

type Props = {
  teamA: TeamProfile;
  teamB: TeamProfile;
  estimate: ExpectedGoalsEstimate;
  result: SimulationResult;
  keyFactors: string[];
  upsetRisk: UpsetRisk;
  modelConfidence: ModelConfidence;
  goalTempo: "低" | "中" | "高";
  lastRunLabel: string;
};

export function ResultPanel({
  teamA,
  teamB,
  estimate,
  result,
  keyFactors,
  upsetRisk,
  modelConfidence,
  goalTempo,
  lastRunLabel,
}: Props) {
  return (
    <section className="card result-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2>模拟结果</h2>
        </div>
        <span>{lastRunLabel}</span>
      </div>

      <div className="probability-grid">
        <Probability label={`${teamA.name}胜`} value={result.teamAWinProbability} />
        <Probability label="平局" value={result.drawProbability} />
        <Probability label={`${teamB.name}胜`} value={result.teamBWinProbability} />
      </div>

      <div className="xg-grid">
        <div>
          <span>{teamA.flagEmoji} {teamA.name}预期进球</span>
          <strong>{estimate.lambdaA.toFixed(2)}</strong>
        </div>
        <div>
          <span>{teamB.flagEmoji} {teamB.name}预期进球</span>
          <strong>{estimate.lambdaB.toFixed(2)}</strong>
        </div>
      </div>

      <div className="score-grid">
        {result.mostCommonScores.map((score) => (
          <div className="score-pill" key={score.score}>
            <strong>{score.score}</strong>
            <span>{Math.round(score.probability * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="status-grid">
        <Status label="大比分倾向" value={goalTempo} />
        <Status label="爆冷风险" value={upsetRisk} />
        <Status label="模型信心" value={modelConfidence} />
        <Status label="双方进球" value={`${Math.round(result.bothTeamsScoreProbability * 100)}%`} />
      </div>

      <div className="factor-block">
        <h3>关键影响因素</h3>
        <ol>
          {keyFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Probability({ label, value }: { label: string; value: number }) {
  return (
    <div className="probability-card">
      <span>{label}</span>
      <strong>{Math.round(value * 100)}%</strong>
      <i style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
