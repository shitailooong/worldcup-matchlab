export type TeamProfile = {
  id: string;
  name: string;
  flagEmoji: string;
  styleLabel: string;
  styleDescription?: string;
  beginnerSummary?: string;
  starPlayers?: string[];
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

export type MatchFixture = {
  id: string;
  dateTime: string;
  group: string;
  matchday: string;
  type: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  finished: boolean;
  status: string;
  stadiumId?: string;
};

export type ScheduleSourceStatus = "loading" | "online" | "fallback";

export type AppView = "beginner" | "schedule" | "predict" | "seed";

export type TeamSeedMetric =
  | "overallStrength"
  | "recentForm"
  | "attackPower"
  | "defensePower"
  | "midfieldControl"
  | "pressingIntensity"
  | "buildUpUnderPressure"
  | "counterAttack"
  | "defensiveLineHeight"
  | "setPieceAttack"
  | "setPieceDefense"
  | "goalkeeper"
  | "squadDepth"
  | "injuryImpact"
  | "fatigue"
  | "penaltyShootout"
  | "mentalPressure"
  | "tacticalFlexibility"
  | "starPlayerImpact";

export type TeamSeedAdjustments = Partial<Record<TeamSeedMetric, number>>;

export type TeamSeedAdjustmentMap = Record<string, TeamSeedAdjustments>;

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

export type SimulationWeights = WeightSettings;

export type MatchProfile = {
  id: string;
  teamAId: string;
  teamBId: string;
  stage: "group" | "knockout" | "quarter" | "semi" | "final";
  kickoffTime: string;
  importance: number;
  heat: number;
  beginnerFriendlyScore: number;
  storyLabel: string;
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

export type LlmSettings = {
  enabled: boolean;
  providerId: string;
  model: string;
  apiKey: string;
};

export type LlmSimulationOutput = {
  verdict: string;
  teamAWinProbability: number;
  drawProbability: number;
  teamBWinProbability: number;
  expectedGoalsA: number;
  expectedGoalsB: number;
  mostLikelyScore: string;
  goalTempo: "低" | "中" | "高";
  upsetRisk: UpsetRisk;
  modelConfidence: ModelConfidence;
  processSteps: Array<{
    title: string;
    body: string;
  }>;
  keyFactors: string[];
};

export type LlmStatus = "idle" | "running" | "success" | "error";

export type BeginnerMatchIntro = {
  analogy: string;
  teamAStyle: string;
  teamBStyle: string;
  focusQuestion: string;
  likelyStory: string;
  whyWatch: string;
  oneThingToWatch: string;
  summary: string;
};

export type WatchingTip = {
  title: string;
  body: string;
};

export type ConversationCard = {
  questions: string[];
};

export type GlossaryTerm = {
  term: string;
  shortExplanation: string;
  beginnerExplanation: string;
  howToSpot: string;
};

export type LiveSituation =
  | "scoreless"
  | "one_side_leads"
  | "red_card"
  | "last_15"
  | "extra_time"
  | "penalties"
  | "boring"
  | "possession_no_goal";

export type PostMatchInput = {
  match: MatchFixture;
  teamA: TeamProfile;
  teamB: TeamProfile;
  teamAScore: number;
  teamBScore: number;
  firstScorer?: "teamA" | "teamB" | "none";
  hasRedCard?: boolean;
  wentExtraTime?: boolean;
  wentPenalties?: boolean;
  feltConfusing?: boolean;
};

export type PostMatchReview = {
  whatHappened: string;
  turningPoint: string;
  betterTeam: string;
  scoreReflection: string;
  meaning: string;
  socialCaption: string;
};
