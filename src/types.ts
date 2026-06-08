export type TeamProfile = {
  id: string;
  name: string;
  flagEmoji: string;
  styleLabel: string;
  overallStrength: number;
  recentForm: number;
  attackPower: number;
  defensePower: number;
  midfieldControl: number;
  pressingIntensity: number;
  buildUpUnderPressure: number;
  counterAttack: number;
  defensiveLineHeight: number;
  setPieceAttack: number;
  setPieceDefense: number;
  goalkeeper: number;
  squadDepth: number;
  injuryImpact: number;
  fatigue: number;
  penaltyShootout: number;
  mentalPressure: number;
  tacticalFlexibility: number;
  starPlayerImpact: number;
  notes: string[];
};

export type WeightSettings = {
  overallStrength: number;
  recentForm: number;
  attackPower: number;
  defensePower: number;
  midfieldControl: number;
  injuryImpact: number;
  fatigue: number;
  tacticalMatchup: number;
  setPiece: number;
  goalkeeper: number;
  penaltyShootout: number;
  mentalPressure: number;
};

export type MatchStage = "group" | "knockout" | "final";
export type Venue = "neutral" | "teamA_home" | "teamB_home";
export type Weather = "normal" | "hot" | "rainy" | "cold";
export type RefereeStrictness = "low" | "medium" | "high";

export type MatchContext = {
  matchStage: MatchStage;
  venue: Venue;
  weather: Weather;
  refereeStrictness: RefereeStrictness;
  restAdvantage: number;
  altitudeEffect: number;
};

export type ModuleScores = {
  positive: number;
  risk: number;
  weightedScore: number;
  normalizedWeights: WeightSettings;
};

export type ExpectedGoalsEstimate = {
  lambdaA: number;
  lambdaB: number;
  ratingA: number;
  ratingB: number;
  tacticalModifierA: number;
  tacticalModifierB: number;
  contextModifierA: number;
  contextModifierB: number;
};

export type ScoreLine = {
  score: string;
  count: number;
  probability: number;
};

export type SimulationResult = {
  teamAWinProbability: number;
  drawProbability: number;
  teamBWinProbability: number;
  expectedGoalsA: number;
  expectedGoalsB: number;
  mostCommonScores: ScoreLine[];
  over25Probability: number;
  bothTeamsScoreProbability: number;
};

export type UpsetRisk = "低" | "中" | "高";
export type ModelConfidence = "低" | "中" | "高";
