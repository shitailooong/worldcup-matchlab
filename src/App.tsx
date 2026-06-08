import { useMemo, useState } from "react";
import { EnvironmentPanel } from "./components/EnvironmentPanel";
import { ResultPanel } from "./components/ResultPanel";
import { ShareCard } from "./components/ShareCard";
import { TeamCard } from "./components/TeamCard";
import { TeamSelector } from "./components/TeamSelector";
import { WeightPanel } from "./components/WeightPanel";
import { teams } from "./data/teams";
import {
  estimateExpectedGoals,
  getGoalTempo,
  getKeyFactors,
  getModelConfidence,
  getUpsetRisk,
  runMonteCarlo,
} from "./lib/simulation";
import type { MatchContext, SimulationResult, WeightSettings } from "./types";

const defaultWeights: WeightSettings = {
  overallStrength: 18,
  recentForm: 12,
  attackPower: 16,
  defensePower: 15,
  midfieldControl: 11,
  injuryImpact: 8,
  fatigue: 7,
  tacticalMatchup: 12,
  setPiece: 8,
  goalkeeper: 9,
  penaltyShootout: 7,
  mentalPressure: 10,
};

const defaultContext: MatchContext = {
  matchStage: "group",
  venue: "neutral",
  weather: "normal",
  refereeStrictness: "medium",
  restAdvantage: 0,
  altitudeEffect: 0,
};

const presets: Record<string, WeightSettings> = {
  小白默认: defaultWeights,
  进攻优先: {
    ...defaultWeights,
    attackPower: 24,
    midfieldControl: 14,
    tacticalMatchup: 14,
    defensePower: 10,
    goalkeeper: 6,
  },
  防守优先: {
    ...defaultWeights,
    defensePower: 24,
    goalkeeper: 15,
    setPiece: 10,
    attackPower: 10,
    tacticalMatchup: 10,
  },
  爆冷模式: {
    ...defaultWeights,
    recentForm: 18,
    tacticalMatchup: 20,
    setPiece: 15,
    overallStrength: 10,
    mentalPressure: 13,
  },
  淘汰赛模式: {
    ...defaultWeights,
    mentalPressure: 18,
    penaltyShootout: 18,
    defensePower: 18,
    goalkeeper: 14,
    attackPower: 12,
  },
};

export default function App() {
  const [teamAId, setTeamAId] = useState("france");
  const [teamBId, setTeamBId] = useState("portugal");
  const [weights, setWeights] = useState<WeightSettings>(defaultWeights);
  const [context, setContext] = useState<MatchContext>(defaultContext);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastRunLabel, setLastRunLabel] = useState("尚未模拟");

  const teamA = teams.find((team) => team.id === teamAId) ?? teams[0];
  const teamB = teams.find((team) => team.id === teamBId) ?? teams[1];

  const estimate = useMemo(
    () => estimateExpectedGoals(teamA, teamB, weights, context),
    [context, teamA, teamB, weights],
  );

  const previewResult = useMemo(
    () => result ?? runMonteCarlo(estimate.lambdaA, estimate.lambdaB, 2400),
    [estimate.lambdaA, estimate.lambdaB, result],
  );

  const keyFactors = useMemo(
    () => getKeyFactors(teamA, teamB, weights, context, previewResult),
    [context, previewResult, teamA, teamB, weights],
  );

  const upsetRisk = getUpsetRisk(teamA, teamB, previewResult);
  const modelConfidence = getModelConfidence(teamA, teamB);
  const goalTempo = getGoalTempo(previewResult);
  const topScore = previewResult.mostCommonScores[0]?.score ?? "1-1";

  function runSimulation() {
    const nextResult = runMonteCarlo(estimate.lambdaA, estimate.lambdaB, 10000);
    setResult(nextResult);
    setLastRunLabel(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MatchLab</p>
          <h1>世界杯多维球队模拟器</h1>
          <p className="subtitle">自己调参数，一键模拟比赛走势</p>
          <p className="disclaimer">数据模拟仅用于分析和娱乐，不代表真实结果；当前为演示数据，可后续接入真实 API。</p>
        </div>
        <button className="simulate-button hero-button" type="button" onClick={runSimulation}>
          模拟 10000 次比赛
        </button>
      </section>

      <TeamSelector
        teamAId={teamAId}
        teamBId={teamBId}
        teams={teams}
        onTeamAChange={(id) => {
          setTeamAId(id);
          setResult(null);
        }}
        onTeamBChange={(id) => {
          setTeamBId(id);
          setResult(null);
        }}
      />

      <section className="team-grid">
        <TeamCard team={teamA} label="Team A" />
        <TeamCard team={teamB} label="Team B" />
      </section>

      <section className="control-grid">
        <WeightPanel
          weights={weights}
          presets={presets}
          onChange={(nextWeights) => {
            setWeights(nextWeights);
            setResult(null);
          }}
          onReset={() => {
            setWeights(defaultWeights);
            setResult(null);
          }}
        />
        <EnvironmentPanel
          context={context}
          onChange={(nextContext) => {
            setContext(nextContext);
            setResult(null);
          }}
        />
      </section>

      <button className="simulate-button full-width" type="button" onClick={runSimulation}>
        模拟 10000 次比赛
      </button>

      <ResultPanel
        teamA={teamA}
        teamB={teamB}
        estimate={estimate}
        result={previewResult}
        keyFactors={keyFactors}
        upsetRisk={upsetRisk}
        modelConfidence={modelConfidence}
        goalTempo={goalTempo}
        lastRunLabel={lastRunLabel}
      />

      <ShareCard
        teamA={teamA}
        teamB={teamB}
        result={previewResult}
        expectedGoalsA={estimate.lambdaA}
        expectedGoalsB={estimate.lambdaB}
        topScore={topScore}
        keyFactors={keyFactors}
      />
    </main>
  );
}
