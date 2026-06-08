import type {
  ExpectedGoalsEstimate,
  MatchContext,
  ModelConfidence,
  ModuleScores,
  SimulationResult,
  TeamProfile,
  UpsetRisk,
  WeightSettings,
} from "../types";

const EPSILON = 0.0001;

export function normalizeWeights(weights: WeightSettings): WeightSettings {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) {
    const equalWeight = 1 / Object.keys(weights).length;
    return Object.fromEntries(Object.keys(weights).map((key) => [key, equalWeight])) as WeightSettings;
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total]),
  ) as WeightSettings;
}

export function computeModuleScores(team: TeamProfile, weights: WeightSettings): ModuleScores {
  const normalizedWeights = normalizeWeights(weights);
  const setPieceComposite = (team.setPieceAttack + team.setPieceDefense) / 2;
  const tacticalComposite =
    (team.pressingIntensity +
      team.buildUpUnderPressure +
      team.counterAttack +
      team.tacticalFlexibility) /
    4;

  const positive =
    team.overallStrength * normalizedWeights.overallStrength +
    team.recentForm * normalizedWeights.recentForm +
    team.attackPower * normalizedWeights.attackPower +
    team.defensePower * normalizedWeights.defensePower +
    team.midfieldControl * normalizedWeights.midfieldControl +
    tacticalComposite * normalizedWeights.tacticalMatchup +
    setPieceComposite * normalizedWeights.setPiece +
    team.goalkeeper * normalizedWeights.goalkeeper +
    team.penaltyShootout * normalizedWeights.penaltyShootout +
    team.mentalPressure * normalizedWeights.mentalPressure;

  const injuryPenalty = team.injuryImpact * normalizedWeights.injuryImpact;
  const fatiguePenalty = team.fatigue * normalizedWeights.fatigue;
  const weightedScore = clamp(positive - injuryPenalty - fatiguePenalty, 0, 100);

  return {
    positive,
    risk: injuryPenalty + fatiguePenalty,
    weightedScore,
    normalizedWeights,
  };
}

export function computeTacticalModifier(
  teamA: TeamProfile,
  teamB: TeamProfile,
  context: MatchContext,
): { tacticalModifierA: number; tacticalModifierB: number } {
  let modifierA = 0;
  let modifierB = 0;

  modifierA += ((teamA.pressingIntensity - teamB.buildUpUnderPressure) / 100) * 0.12;
  modifierB += ((teamB.pressingIntensity - teamA.buildUpUnderPressure) / 100) * 0.12;
  modifierA += ((teamA.counterAttack - teamB.defensiveLineHeight) / 100) * 0.15;
  modifierB += ((teamB.counterAttack - teamA.defensiveLineHeight) / 100) * 0.15;
  modifierA += ((teamA.setPieceAttack - teamB.setPieceDefense) / 100) * 0.1;
  modifierB += ((teamB.setPieceAttack - teamA.setPieceDefense) / 100) * 0.1;
  modifierA += ((teamA.midfieldControl - teamB.counterAttack) / 100) * 0.08;
  modifierB += ((teamB.midfieldControl - teamA.counterAttack) / 100) * 0.08;
  modifierA += ((teamA.goalkeeper - teamB.attackPower) / 100) * 0.06;
  modifierB += ((teamB.goalkeeper - teamA.attackPower) / 100) * 0.06;

  if (context.matchStage !== "group") {
    modifierA += ((teamA.penaltyShootout - teamB.penaltyShootout) / 100) * 0.08;
    modifierB += ((teamB.penaltyShootout - teamA.penaltyShootout) / 100) * 0.08;
  }

  return {
    tacticalModifierA: clamp(modifierA, -0.35, 0.35),
    tacticalModifierB: clamp(modifierB, -0.35, 0.35),
  };
}

export function estimateExpectedGoals(
  teamA: TeamProfile,
  teamB: TeamProfile,
  weights: WeightSettings,
  context: MatchContext,
): ExpectedGoalsEstimate {
  const baseGoalRate = 1.35;
  const ratingA = computeModuleScores(teamA, weights).weightedScore;
  const ratingB = computeModuleScores(teamB, weights).weightedScore;
  const { tacticalModifierA, tacticalModifierB } = computeTacticalModifier(teamA, teamB, context);
  const contextModifierA = getContextModifier(teamA, context, "A");
  const contextModifierB = getContextModifier(teamB, context, "B");

  let lambdaA =
    baseGoalRate +
    ((teamA.attackPower - teamB.defensePower) / 100) * 0.75 +
    ((teamA.midfieldControl - teamB.midfieldControl) / 100) * 0.24 +
    ((ratingA - ratingB) / 100) * 0.35 +
    tacticalModifierA +
    contextModifierA -
    ((teamA.injuryImpact + teamA.fatigue) / 100) * 0.22 -
    ((teamB.goalkeeper + teamB.defensePower - 160) / 100) * 0.24;

  let lambdaB =
    baseGoalRate +
    ((teamB.attackPower - teamA.defensePower) / 100) * 0.75 +
    ((teamB.midfieldControl - teamA.midfieldControl) / 100) * 0.24 +
    ((ratingB - ratingA) / 100) * 0.35 +
    tacticalModifierB +
    contextModifierB -
    ((teamB.injuryImpact + teamB.fatigue) / 100) * 0.22 -
    ((teamA.goalkeeper + teamA.defensePower - 160) / 100) * 0.24;

  if (context.matchStage === "knockout") {
    lambdaA *= 0.93;
    lambdaB *= 0.93;
  }
  if (context.matchStage === "final") {
    lambdaA *= 0.86;
    lambdaB *= 0.86;
  }
  if (context.weather === "rainy") {
    lambdaA *= 0.9;
    lambdaB *= 0.9;
  }
  if (context.weather === "hot") {
    lambdaA -= teamA.fatigue * 0.0028;
    lambdaB -= teamB.fatigue * 0.0028;
  }
  if (context.refereeStrictness === "high") {
    lambdaA -= (100 - teamA.mentalPressure) * 0.0018;
    lambdaB -= (100 - teamB.mentalPressure) * 0.0018;
  }
  if (context.refereeStrictness === "low") {
    lambdaA += teamA.pressingIntensity * 0.0009;
    lambdaB += teamB.pressingIntensity * 0.0009;
  }

  return {
    lambdaA: clamp(lambdaA, 0.2, 3.6),
    lambdaB: clamp(lambdaB, 0.2, 3.6),
    ratingA,
    ratingB,
    tacticalModifierA,
    tacticalModifierB,
    contextModifierA,
    contextModifierB,
  };
}

export function runMonteCarlo(lambdaA: number, lambdaB: number, iterations = 10000): SimulationResult {
  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;
  let over25 = 0;
  let bothTeamsScore = 0;
  let totalGoalsA = 0;
  let totalGoalsB = 0;
  const scoreCounts = new Map<string, number>();

  for (let i = 0; i < iterations; i += 1) {
    const goalsA = poissonRandom(lambdaA);
    const goalsB = poissonRandom(lambdaB);
    totalGoalsA += goalsA;
    totalGoalsB += goalsB;

    if (goalsA > goalsB) teamAWins += 1;
    else if (goalsB > goalsA) teamBWins += 1;
    else draws += 1;

    if (goalsA + goalsB > 2.5) over25 += 1;
    if (goalsA > 0 && goalsB > 0) bothTeamsScore += 1;

    const key = `${goalsA}-${goalsB}`;
    scoreCounts.set(key, (scoreCounts.get(key) || 0) + 1);
  }

  const mostCommonScores = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([score, count]) => ({
      score,
      count,
      probability: count / iterations,
    }));

  return {
    teamAWinProbability: teamAWins / iterations,
    drawProbability: draws / iterations,
    teamBWinProbability: teamBWins / iterations,
    expectedGoalsA: totalGoalsA / iterations,
    expectedGoalsB: totalGoalsB / iterations,
    mostCommonScores,
    over25Probability: over25 / iterations,
    bothTeamsScoreProbability: bothTeamsScore / iterations,
  };
}

export function poissonRandom(lambda: number): number {
  const safeLambda = Math.max(EPSILON, lambda);
  const limit = Math.exp(-safeLambda);
  let product = 1;
  let count = 0;

  do {
    count += 1;
    product *= Math.random();
  } while (product > limit);

  return count - 1;
}

export function getKeyFactors(
  teamA: TeamProfile,
  teamB: TeamProfile,
  weights: WeightSettings,
  context: MatchContext,
  simulationResult: SimulationResult,
): string[] {
  const normalized = normalizeWeights(weights);
  const factors = [
    {
      score: Math.abs(teamA.counterAttack - teamB.defensiveLineHeight) * normalized.tacticalMatchup,
      text:
        teamA.counterAttack > teamB.defensiveLineHeight
          ? `${teamA.name}的反击速度会冲击${teamB.name}防线身后。`
          : `${teamB.name}的防线站位会限制${teamA.name}反击空间。`,
    },
    {
      score: Math.abs(teamB.counterAttack - teamA.defensiveLineHeight) * normalized.tacticalMatchup,
      text:
        teamB.counterAttack > teamA.defensiveLineHeight
          ? `${teamB.name}的快速反击对${teamA.name}高位防线有威胁。`
          : `${teamA.name}防线站位会压缩${teamB.name}反击空间。`,
    },
    {
      score: Math.abs(teamA.midfieldControl - teamB.midfieldControl) * normalized.midfieldControl,
      text:
        teamA.midfieldControl > teamB.midfieldControl
          ? `${teamA.name}中场控制更强，会提高持续进攻时间。`
          : `${teamB.name}中场控制更强，会降低${teamA.name}持续压迫时间。`,
    },
    {
      score:
        Math.abs(teamA.setPieceAttack - teamB.setPieceDefense) * normalized.setPiece +
        Math.abs(teamB.setPieceAttack - teamA.setPieceDefense) * normalized.setPiece,
      text:
        teamA.setPieceAttack - teamB.setPieceDefense > teamB.setPieceAttack - teamA.setPieceDefense
          ? `${teamA.name}定位球优势会提高小比分获胜概率。`
          : `${teamB.name}定位球更可能改变僵局。`,
    },
    {
      score: Math.abs(teamA.goalkeeper - teamB.goalkeeper) * normalized.goalkeeper,
      text:
        teamA.goalkeeper > teamB.goalkeeper
          ? `${teamA.name}门将能力更稳，会压低${teamB.name}射门转化率。`
          : `${teamB.name}门将能力更稳，会压低${teamA.name}射门转化率。`,
    },
    {
      score: Math.abs(teamA.injuryImpact - teamB.injuryImpact) * normalized.injuryImpact,
      text:
        teamA.injuryImpact < teamB.injuryImpact
          ? `当前伤停参数对${teamA.name}影响较小。`
          : `当前伤停参数对${teamB.name}影响较小。`,
    },
    {
      score: Math.abs(teamA.fatigue - teamB.fatigue) * normalized.fatigue,
      text:
        teamA.fatigue < teamB.fatigue
          ? `${teamA.name}体能压力更低，后程稳定性更好。`
          : `${teamB.name}体能压力更低，后程稳定性更好。`,
    },
    {
      score: context.matchStage === "group" ? 0 : Math.abs(teamA.penaltyShootout - teamB.penaltyShootout),
      text:
        teamA.penaltyShootout > teamB.penaltyShootout
          ? `如果比赛进入点球大战，${teamA.name}点球能力会提高淘汰赛胜率。`
          : `如果比赛进入点球大战，${teamB.name}点球能力会提高淘汰赛胜率。`,
    },
    {
      score: Math.abs(simulationResult.teamAWinProbability - simulationResult.teamBWinProbability) * 30,
      text:
        simulationResult.drawProbability > 0.28
          ? `模型认为平局概率偏高，这场更像细节局。`
          : `胜负概率已经拉开，比赛可能由一两个核心变量决定。`,
    },
  ];

  return factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((factor) => factor.text);
}

export function getUpsetRisk(
  teamA: TeamProfile,
  teamB: TeamProfile,
  simulationResult: SimulationResult,
): UpsetRisk {
  const scoreA = basicTeamRating(teamA);
  const scoreB = basicTeamRating(teamB);
  const weakerWinProbability =
    scoreA < scoreB ? simulationResult.teamAWinProbability : simulationResult.teamBWinProbability;

  if (weakerWinProbability > 0.3) return "高";
  if (weakerWinProbability >= 0.2) return "中";
  return "低";
}

export function getModelConfidence(teamA: TeamProfile, teamB: TeamProfile): ModelConfidence {
  const values = [...Object.values(teamA), ...Object.values(teamB)].filter(
    (value) => typeof value === "number",
  ) as number[];
  const missing = values.filter((value) => Number.isNaN(value)).length;
  if (missing > 4) return "低";

  const gap = Math.abs(basicTeamRating(teamA) - basicTeamRating(teamB));
  if (gap >= 8) return "高";
  if (gap >= 3) return "中";
  return "中";
}

export function getGoalTempo(result: SimulationResult): "低" | "中" | "高" {
  if (result.over25Probability >= 0.58) return "高";
  if (result.over25Probability >= 0.42) return "中";
  return "低";
}

function getContextModifier(team: TeamProfile, context: MatchContext, side: "A" | "B"): number {
  let modifier = 0;

  if (context.venue === "teamA_home") modifier += side === "A" ? 0.12 : -0.06;
  if (context.venue === "teamB_home") modifier += side === "B" ? 0.12 : -0.06;

  if (context.weather === "rainy") {
    modifier -= team.midfieldControl * 0.0015;
    modifier -= team.attackPower * 0.001;
  }
  if (context.weather === "cold") {
    modifier -= (100 - team.mentalPressure) * 0.0008;
  }

  const restDirection = side === "A" ? 1 : -1;
  modifier += context.restAdvantage * restDirection * 0.035;
  modifier -= (context.altitudeEffect / 100) * (team.fatigue / 100) * 0.18;

  return clamp(modifier, -0.32, 0.32);
}

function basicTeamRating(team: TeamProfile): number {
  return (
    team.overallStrength * 0.28 +
    team.attackPower * 0.16 +
    team.defensePower * 0.16 +
    team.midfieldControl * 0.14 +
    team.recentForm * 0.1 +
    team.squadDepth * 0.08 +
    team.mentalPressure * 0.08 -
    team.injuryImpact * 0.06 -
    team.fatigue * 0.04
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
