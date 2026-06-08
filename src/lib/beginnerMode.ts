import type {
  BeginnerMatchIntro,
  ConversationCard,
  LiveSituation,
  MatchFixture,
  PostMatchInput,
  PostMatchReview,
  TeamProfile,
  WatchingTip,
} from "../types";
import { getDisplayName } from "./teamProfiles";

export type BeginnerRecommendation = {
  match: MatchFixture;
  rating: number;
  reason: string;
  downside: string;
  worthStayingUp: string;
  tagline: string;
  tags: string[];
};

export function getTodayRecommendations(
  matches: MatchFixture[],
  getTeam: (country: string) => TeamProfile,
): BeginnerRecommendation[] {
  return matches
    .filter((match) => match.home.toUpperCase() !== "TBD" && match.away.toUpperCase() !== "TBD")
    .map((match) => {
      const teamA = getTeam(match.home);
      const teamB = getTeam(match.away);
      return buildRecommendation(match, teamA, teamB);
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
}

export function buildRecommendation(
  match: MatchFixture,
  teamA: TeamProfile,
  teamB: TeamProfile,
): BeginnerRecommendation {
  const quality = (teamA.overallStrength + teamB.overallStrength) / 2;
  const styleGap = Math.abs(teamA.counterAttack - teamB.midfieldControl) + Math.abs(teamB.counterAttack - teamA.midfieldControl);
  const starHeat = (teamA.starPlayerImpact + teamB.starPlayerImpact) / 2;
  const stageBonus = match.type === "group" ? 0 : 12;
  const raw = quality * 0.04 + styleGap * 0.015 + starHeat * 0.025 + stageBonus * 0.05;
  const rating = Math.max(1, Math.min(5, Math.round(raw)));
  const faster = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const controller = teamA.midfieldControl >= teamB.midfieldControl ? teamA : teamB;

  return {
    match,
    rating,
    reason:
      rating >= 4
        ? "强度够、风格差异明显，小白不用懂复杂战术也能看出节奏变化。"
        : "适合当作入门比赛看，重点观察两队谁更能把球推进到危险区域。",
    downside:
      Math.abs(teamA.overallStrength - teamB.overallStrength) > 16
        ? "如果强弱差距很快拉开，下半场可能会失去悬念。"
        : "如果双方都太谨慎，前半小时可能会比较沉闷。",
    worthStayingUp: rating >= 4 ? "值得看上半场，节奏快再继续看下半场。" : "不一定要熬全场，可以先看前 30 分钟找感觉。",
    tagline: `${faster.name}想把比赛踢快，${controller.name}更想把节奏控住。`,
    tags: getAudienceTags(teamA, teamB, rating),
  };
}

export function getBeginnerMatchIntro(
  match: MatchFixture,
  teamA: TeamProfile,
  teamB: TeamProfile,
): BeginnerMatchIntro {
  const fastTeam = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const controlTeam = teamA.midfieldControl >= teamB.midfieldControl ? teamA : teamB;
  const pressureTeam = teamA.pressingIntensity >= teamB.pressingIntensity ? teamA : teamB;
  const stableTeam = teamA.defensePower + teamA.goalkeeper >= teamB.defensePower + teamB.goalkeeper ? teamA : teamB;

  return {
    analogy: `${fastTeam.name}像速度型选手，${controlTeam.name}像节奏型选手。`,
    teamAStyle: describeTeamForBeginner(teamA),
    teamBStyle: describeTeamForBeginner(teamB),
    focusQuestion: `${controlTeam.name}能不能控制住中场，不让${fastTeam.name}轻松打反击。`,
    likelyStory: `${pressureTeam.name}会尝试把比赛压到对方半场，${stableTeam.name}则需要先保证禁区附近不乱。`,
    whyWatch: getWhyWatch(match, teamA, teamB),
    oneThingToWatch: `如果只看一个地方，就看${controlTeam.name}中场一丢球，${fastTeam.name}能不能马上冲到禁区附近。`,
    summary: "这不是单纯比谁球星多，而是比谁能把比赛带进自己舒服的节奏。",
  };
}

export function getWatchingTips(_match: MatchFixture, teamA: TeamProfile, teamB: TeamProfile): WatchingTip[] {
  const faster = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const deeper = teamA.squadDepth >= teamB.squadDepth ? teamA : teamB;
  return [
    {
      title: "看谁更容易把球推进到对方禁区附近",
      body: "这比单纯控球更重要。能进到危险区域，才说明真的制造了威胁。",
    },
    {
      title: "看丢球后谁抢得更快",
      body: "这能看出球队有没有压迫能力。压迫就是丢球后马上围上去，不让对手舒服传球。",
    },
    {
      title: `看${faster.name}的反击和${deeper.name}的替补`,
      body: "世界杯里，最后 20 分钟经常不是首发决定比赛，而是谁还有能改变节奏的人。",
    },
  ];
}

export function getConversationCard(match: MatchFixture, teamA: TeamProfile, teamB: TeamProfile): ConversationCard {
  const controlTeam = teamA.midfieldControl >= teamB.midfieldControl ? teamA : teamB;
  const fastTeam = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const penaltyTeam = teamA.penaltyShootout >= teamB.penaltyShootout ? teamA : teamB;
  const stageQuestion = match.type === "group" ? "这个比分对出线有什么影响？" : "如果拖到加时，哪边更吃亏？";

  return {
    questions: [
      "这场哪边更需要赢？",
      `${fastTeam.name}是不是更适合打反击？`,
      `${controlTeam.name}是不是更依赖中场控制？`,
      `如果拖到点球，${penaltyTeam.name}会不会更有优势？`,
      stageQuestion,
    ],
  };
}

export function getLiveSituationTip(
  situation: LiveSituation,
  _match: MatchFixture,
  teamA: TeamProfile,
  teamB: TeamProfile,
): string {
  const controlTeam = teamA.midfieldControl >= teamB.midfieldControl ? teamA : teamB;
  const fastTeam = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const calmTeam = teamA.mentalPressure >= teamB.mentalPressure ? teamA : teamB;
  const tips: Record<LiveSituation, string> = {
    scoreless: `不要只觉得无聊。你可以看${controlTeam.name}能不能把球推进到危险区域，如果只是外围倒脚，不一定代表它控制了比赛。`,
    one_side_leads: `领先后重点看落后方有没有办法提速。如果${fastTeam.name}开始频繁反击，比赛还没死。`,
    red_card: "红牌后别只看少一人。重点看被罚下一方是不是收得更深，另一方能不能把人数优势变成禁区里的机会。",
    last_15: `最后 15 分钟看两个点：谁体能先掉，谁的替补更有存在感。这个阶段经常决定比赛记忆点。`,
    extra_time: `加时赛更像耐心和失误控制。重点看${calmTeam.name}能不能减少冒险传球。`,
    penalties: "点球大战不是只看脚法，更看心理和门将判断。你可以看球员助跑是否犹豫、门将是否提前移动。",
    boring: "场面沉闷时，看谁能把球送进禁区。很多比赛不是没内容，而是两队都在等对方先犯错。",
    possession_no_goal: `一方一直控球但不进球时，别急着说它更强。看${fastTeam.name}有没有反击空间，真正危险可能在少数几次转换里。`,
  };
  return tips[situation];
}

export function generatePostMatchReview(input: PostMatchInput): PostMatchReview {
  const { teamA, teamB, teamAScore, teamBScore } = input;
  const winner = teamAScore === teamBScore ? null : teamAScore > teamBScore ? teamA : teamB;
  const loser = winner ? (winner.id === teamA.id ? teamB : teamA) : null;
  const controlTeam = teamA.midfieldControl >= teamB.midfieldControl ? teamA : teamB;
  const directTeam = teamA.counterAttack >= teamB.counterAttack ? teamA : teamB;
  const close = Math.abs(teamAScore - teamBScore) <= 1;

  return {
    whatHappened: winner
      ? `${winner.name}赢在更会把关键机会变成结果，${loser?.name}并不一定全场都差。`
      : "这场可以理解为双方都没能把自己的优势完全转成进球。",
    turningPoint: input.hasRedCard
      ? "红牌改变了比赛空间，后面的判断不能只按正常 11 打 11 来看。"
      : input.wentPenalties
        ? "真正的转折在点球大战，心理稳定性比场面数据更重要。"
        : `${directTeam.name}每次提速都更接近制造危险，这是最值得回看的地方。`,
    betterTeam: winner
      ? `${winner.name}结果更好，但如果只看过程，${controlTeam.name}可能有不少时间掌握节奏。`
      : `${controlTeam.name}更能控制过程，${directTeam.name}更像是在等直接威胁。`,
    scoreReflection: close
      ? "比分基本反映了比赛很接近，差距主要来自几个关键瞬间。"
      : "比分看起来拉开了，但普通用户更该看清楚：是哪几个回合让比赛突然变向。",
    meaning: input.feltConfusing
      ? "如果你觉得看不懂，先别看复杂术语，只记住谁创造了更危险的机会。"
      : "这场说明世界杯不只比控球，也比谁能在关键区域做出更有效的动作。",
    socialCaption: `不一定控球多就更接近胜利，世界杯有时候拼的是那几个真正危险的瞬间。`,
  };
}

function describeTeamForBeginner(team: TeamProfile): string {
  if (team.counterAttack >= 88) return "速度快、冲击强，能突然把比赛提速。";
  if (team.midfieldControl >= 88) return "技术细、喜欢控制节奏，靠中场慢慢把局面理顺。";
  if (team.defensePower + team.goalkeeper >= 172) return "防守和门将比较稳，不容易被一两次机会打穿。";
  if (team.setPieceAttack >= 84) return "定位球威胁大，角球和任意球都值得多看一眼。";
  return team.beginnerSummary || team.styleLabel;
}

function getWhyWatch(match: MatchFixture, teamA: TeamProfile, teamB: TeamProfile): string {
  if (match.type !== "group") return "淘汰赛输球就出局，球队会更谨慎，但每次失误也更贵。";
  if ((teamA.starPlayerImpact + teamB.starPlayerImpact) / 2 >= 88) return "球星影响足够高，小白容易通过个人突破和关键球看出差别。";
  return "它适合练习看比赛故事：谁控节奏、谁打反击、谁先进危险区域。";
}

function getAudienceTags(teamA: TeamProfile, teamB: TeamProfile, rating: number): string[] {
  const tags = rating >= 4 ? ["小白友好", "值得重点看"] : ["轻松入门"];
  if (Math.max(teamA.starPlayerImpact, teamB.starPlayerImpact) >= 90) tags.push("看球星");
  if (Math.abs(teamA.midfieldControl - teamB.midfieldControl) >= 8) tags.push("看节奏");
  if (Math.max(teamA.counterAttack, teamB.counterAttack) >= 88) tags.push("看反击");
  return tags.slice(0, 4);
}

export function getMatchDisplay(match: MatchFixture): string {
  return `${getDisplayName(match.home)} vs ${getDisplayName(match.away)}`;
}
