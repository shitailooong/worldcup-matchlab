import { useCallback, useEffect, useMemo, useState } from "react";
import { BeginnerHome } from "./components/BeginnerHome";
import { PredictionProcess } from "./components/PredictionProcess";
import { ScheduleBoard } from "./components/ScheduleBoard";
import { SeedAdjustPanel } from "./components/SeedAdjustPanel";
import { TopNav } from "./components/TopNav";
import { defaultLlmSettings, getLlmProvider, requestLlmSimulation } from "./lib/llmSimulation";
import { getFallbackSchedule, fetchWorldCupSchedule } from "./lib/schedule";
import {
  estimateExpectedGoals,
  getGoalTempo,
  getKeyFactors,
  getModelConfidence,
  getUpsetRisk,
  runMonteCarlo,
} from "./lib/simulation";
import { getTeamProfileWithAdjustments } from "./lib/teamProfiles";
import type {
  AppView,
  LlmSettings,
  LlmSimulationOutput,
  LlmStatus,
  MatchContext,
  MatchFixture,
  ScheduleSourceStatus,
  SimulationResult,
  TeamSeedAdjustmentMap,
  WeightSettings,
} from "./types";

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

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("beginner");
  const [matches, setMatches] = useState<MatchFixture[]>(() => getFallbackSchedule());
  const [sourceStatus, setSourceStatus] = useState<ScheduleSourceStatus>("loading");
  const [selectedMatchId, setSelectedMatchId] = useState("1");
  const [context, setContext] = useState<MatchContext>(defaultContext);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [llmPrediction, setLlmPrediction] = useState<LlmSimulationOutput | null>(null);
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(() => loadLlmSettings());
  const [teamSeedAdjustments, setTeamSeedAdjustments] = useState<TeamSeedAdjustmentMap>(() =>
    loadTeamSeedAdjustments(),
  );
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("idle");
  const [llmError, setLlmError] = useState("");
  const [lastRunLabel, setLastRunLabel] = useState("尚未模拟");

  useEffect(() => {
    let alive = true;
    fetchWorldCupSchedule()
      .then((onlineMatches) => {
        if (!alive) return;
        setMatches(onlineMatches);
        setSourceStatus("online");
        if (!onlineMatches.some((match) => match.id === selectedMatchId)) {
          setSelectedMatchId(onlineMatches[0]?.id || "1");
        }
      })
      .catch(() => {
        if (!alive) return;
        setMatches(getFallbackSchedule());
        setSourceStatus("fallback");
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("worldcup-matchlab-llm-settings", JSON.stringify(llmSettings));
  }, [llmSettings]);

  useEffect(() => {
    localStorage.setItem("worldcup-matchlab-seed-adjustments", JSON.stringify(teamSeedAdjustments));
  }, [teamSeedAdjustments]);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0];
  const getAdjustedTeam = useCallback(
    (country: string) => getTeamProfileWithAdjustments(country, teamSeedAdjustments),
    [teamSeedAdjustments],
  );
  const teamA = useMemo(
    () => getAdjustedTeam(selectedMatch?.home || "France"),
    [getAdjustedTeam, selectedMatch?.home],
  );
  const teamB = useMemo(
    () => getAdjustedTeam(selectedMatch?.away || "Portugal"),
    [getAdjustedTeam, selectedMatch?.away],
  );

  const estimate = useMemo(
    () => estimateExpectedGoals(teamA, teamB, defaultWeights, context),
    [context, teamA, teamB],
  );

  const previewResult = useMemo(
    () => result ?? runMonteCarlo(estimate.lambdaA, estimate.lambdaB, 2400),
    [estimate.lambdaA, estimate.lambdaB, result],
  );

  const keyFactors = useMemo(
    () => getKeyFactors(teamA, teamB, defaultWeights, context, previewResult),
    [context, previewResult, teamA, teamB],
  );

  const upsetRisk = getUpsetRisk(teamA, teamB, previewResult);
  const modelConfidence = getModelConfidence(teamA, teamB);
  const goalTempo = getGoalTempo(previewResult);

  async function runSimulation() {
    const nextResult = runMonteCarlo(estimate.lambdaA, estimate.lambdaB, 10000);
    setResult(nextResult);
    setLlmError("");

    if (llmSettings.enabled) {
      setLlmStatus("running");
      try {
        const nextLlmPrediction = await requestLlmSimulation(llmSettings, {
          match: selectedMatch,
          teamA,
          teamB,
          estimate,
          localResult: nextResult,
          keyFactors,
          context,
        });
        setLlmPrediction(nextLlmPrediction);
        setLlmStatus("success");
      } catch (error) {
        setLlmPrediction(null);
        setLlmStatus("error");
        setLlmError(error instanceof Error ? error.message : "大模型预测失败，请检查接口设置。");
      }
    } else {
      setLlmPrediction(null);
      setLlmStatus("idle");
    }

    setLastRunLabel(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  }

  function selectMatch(match: MatchFixture, switchToPredict = false) {
    setSelectedMatchId(match.id);
    setResult(null);
    setLlmPrediction(null);
    setLlmStatus("idle");
    setLlmError("");
    setLastRunLabel("尚未模拟");
    setContext((currentContext) => ({
      ...currentContext,
      matchStage: match.type === "group" ? "group" : match.type === "final" ? "final" : "knockout",
    }));
    if (switchToPredict) setActiveView("predict");
  }

  function updateTeamSeedAdjustments(nextAdjustments: TeamSeedAdjustmentMap) {
    setTeamSeedAdjustments(nextAdjustments);
    setResult(null);
    setLlmPrediction(null);
    setLlmStatus("idle");
    setLlmError("");
    setLastRunLabel("尚未模拟");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">World Cup Assistant</p>
          <h1>世界杯小白观赛助手</h1>
          <p className="subtitle">不懂球，也能看懂今晚比赛</p>
          <p className="disclaimer">本工具只做观赛理解和情景模拟，不提供投注建议；当前为演示数据，可后续接入真实 API。</p>
        </div>
        <TopNav activeView={activeView} onChange={setActiveView} />
      </section>

      {activeView === "beginner" ? (
        <BeginnerHome
          matches={matches}
          selectedMatch={selectedMatch}
          teamA={teamA}
          teamB={teamB}
          getTeam={getAdjustedTeam}
          onOpenAdvanced={() => setActiveView("predict")}
          onSelectMatch={(match) => selectMatch(match)}
        />
      ) : activeView === "schedule" ? (
        <ScheduleBoard
          matches={matches}
          selectedMatchId={selectedMatchId}
          sourceStatus={sourceStatus}
          onSelect={(match) => selectMatch(match, true)}
        />
      ) : activeView === "seed" ? (
        <SeedAdjustPanel matches={matches} adjustments={teamSeedAdjustments} onChange={updateTeamSeedAdjustments} />
      ) : (
        <>
          <ScheduleBoard
            compact
            matches={matches}
            selectedMatchId={selectedMatchId}
            sourceStatus={sourceStatus}
            onSelect={(match) => selectMatch(match)}
          />

          <PredictionProcess
            teamA={teamA}
            teamB={teamB}
            selectedMatch={selectedMatch}
            estimate={estimate}
            result={previewResult}
            keyFactors={keyFactors}
            upsetRisk={upsetRisk}
            modelConfidence={modelConfidence}
            goalTempo={goalTempo}
            lastRunLabel={lastRunLabel}
            llmSettings={llmSettings}
            llmPrediction={llmPrediction}
            llmStatus={llmStatus}
            llmError={llmError}
            onLlmSettingsChange={setLlmSettings}
            onRun={runSimulation}
          />
        </>
      )}
    </main>
  );
}

function loadLlmSettings(): LlmSettings {
  try {
    const saved = localStorage.getItem("worldcup-matchlab-llm-settings");
    if (!saved) return defaultLlmSettings;
    const parsed = JSON.parse(saved) as Partial<LlmSettings>;
    const merged = {
      ...defaultLlmSettings,
      ...parsed,
    };
    const provider = getLlmProvider(merged.providerId);
    return {
      ...merged,
      providerId: provider.id,
      model: provider.models.includes(merged.model) ? merged.model : provider.models[0],
    };
  } catch {
    return defaultLlmSettings;
  }
}

function loadTeamSeedAdjustments(): TeamSeedAdjustmentMap {
  try {
    const saved = localStorage.getItem("worldcup-matchlab-seed-adjustments");
    if (!saved) return {};
    const parsed = JSON.parse(saved) as TeamSeedAdjustmentMap;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}
