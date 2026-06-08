import type { SimulationResult, TeamProfile } from "../types";

type Props = {
  teamA: TeamProfile;
  teamB: TeamProfile;
  result: SimulationResult;
  expectedGoalsA: number;
  expectedGoalsB: number;
  topScore: string;
  keyFactors: string[];
};

export function ShareCard({
  teamA,
  teamB,
  result,
  expectedGoalsA,
  expectedGoalsB,
  topScore,
  keyFactors,
}: Props) {
  const winner =
    result.teamAWinProbability > result.teamBWinProbability
      ? teamA
      : result.teamBWinProbability > result.teamAWinProbability
        ? teamB
        : null;
  const conclusion = winner
    ? `模型更看好${winner.name}，但平局概率仍然值得关注。`
    : "模型认为双方非常接近，更像一场细节局。";

  return (
    <section className="share-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Share Card</p>
          <h2>小红书分享卡</h2>
        </div>
        <span>截图即用</span>
      </div>

      <article className="share-card" id="share-card">
        <p className="share-kicker">MatchLab 模拟结果</p>
        <h2>
          {teamA.flagEmoji} {teamA.name} vs {teamB.flagEmoji} {teamB.name}
        </h2>
        <div className="share-probabilities">
          <ShareStat label={`${teamA.name}胜`} value={`${Math.round(result.teamAWinProbability * 100)}%`} />
          <ShareStat label="平局" value={`${Math.round(result.drawProbability * 100)}%`} />
          <ShareStat label={`${teamB.name}胜`} value={`${Math.round(result.teamBWinProbability * 100)}%`} />
        </div>
        <div className="share-line">
          <span>预期进球</span>
          <strong>
            {expectedGoalsA.toFixed(2)} : {expectedGoalsB.toFixed(2)}
          </strong>
        </div>
        <div className="share-line">
          <span>最可能比分</span>
          <strong>{topScore}</strong>
        </div>
        <p className="share-conclusion">{conclusion}</p>
        <ol>
          {keyFactors.slice(0, 3).map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ol>
        <footer>由「施泰隆｜AI生活实验」生成</footer>
      </article>
    </section>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
