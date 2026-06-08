import { teams } from "../data/teams";
import type { TeamProfile, TeamSeedAdjustments } from "../types";

const chineseNames: Record<string, string> = {
  Algeria: "阿尔及利亚",
  Argentina: "阿根廷",
  Australia: "澳大利亚",
  Austria: "奥地利",
  Belgium: "比利时",
  "Bosnia and Herzegovina": "波黑",
  Brazil: "巴西",
  Canada: "加拿大",
  "Cape Verde": "佛得角",
  Colombia: "哥伦比亚",
  "Congo DR": "刚果民主共和国",
  "Costa Rica": "哥斯达黎加",
  "Cote d'Ivoire": "科特迪瓦",
  "Czech Republic": "捷克",
  Ecuador: "厄瓜多尔",
  Egypt: "埃及",
  England: "英格兰",
  France: "法国",
  Germany: "德国",
  Ghana: "加纳",
  Haiti: "海地",
  Iran: "伊朗",
  Iraq: "伊拉克",
  Japan: "日本",
  Jordan: "约旦",
  Mexico: "墨西哥",
  Morocco: "摩洛哥",
  Netherlands: "荷兰",
  "New Zealand": "新西兰",
  Norway: "挪威",
  Panama: "巴拿马",
  Paraguay: "巴拉圭",
  Portugal: "葡萄牙",
  Qatar: "卡塔尔",
  "Saudi Arabia": "沙特阿拉伯",
  Scotland: "苏格兰",
  Senegal: "塞内加尔",
  "South Africa": "南非",
  "South Korea": "韩国",
  Spain: "西班牙",
  Sweden: "瑞典",
  Switzerland: "瑞士",
  Tunisia: "突尼斯",
  Turkey: "土耳其",
  Türkiye: "土耳其",
  Uruguay: "乌拉圭",
  "United States": "美国",
  USA: "美国",
  Uzbekistan: "乌兹别克斯坦",
};

const flags: Record<string, string> = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  Colombia: "🇨🇴",
  England: "🏴",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Japan: "🇯🇵",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Netherlands: "🇳🇱",
  Portugal: "🇵🇹",
  "South Korea": "🇰🇷",
  Spain: "🇪🇸",
  Switzerland: "🇨🇭",
  "United States": "🇺🇸",
  USA: "🇺🇸",
  Uruguay: "🇺🇾",
};

const aliases: Record<string, string> = {
  "Czech Republic": "czechia",
  Turkey: "turkiye",
  Türkiye: "turkiye",
  "United States": "usa",
  USA: "usa",
  "South Korea": "south-korea",
  "Cote d'Ivoire": "ivory-coast",
  "Cape Verde": "cape-verde",
  "Congo DR": "congo-dr",
  "New Zealand": "new-zealand",
  "South Africa": "south-africa",
};

export function getDisplayName(englishName: string): string {
  return chineseNames[englishName] || englishName;
}

export function getTeamProfile(englishName: string): TeamProfile {
  const normalized = englishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const knownId = aliases[englishName] || normalized;
  const known = teams.find((team) => team.id === knownId || team.name === englishName);
  if (known) return known;

  const seed = hash(englishName);
  const base = 58 + (seed % 18);
  const swing = (offset: number) => ((seed >> offset) % 11) - 5;

  return {
    id: knownId,
    name: getDisplayName(englishName),
    flagEmoji: flags[englishName] || "⚽",
    styleLabel: "演示档案 + 自动生成",
    overallStrength: clamp(base + swing(1), 45, 84),
    recentForm: clamp(base + swing(2), 45, 84),
    attackPower: clamp(base + swing(3), 45, 84),
    defensePower: clamp(base + swing(4), 45, 84),
    midfieldControl: clamp(base + swing(5), 45, 84),
    pressingIntensity: clamp(base + swing(6), 45, 84),
    buildUpUnderPressure: clamp(base + swing(7), 45, 84),
    counterAttack: clamp(base + swing(8), 45, 84),
    defensiveLineHeight: clamp(base + swing(9), 45, 84),
    setPieceAttack: clamp(base + swing(10), 45, 84),
    setPieceDefense: clamp(base + swing(11), 45, 84),
    goalkeeper: clamp(base + swing(12), 45, 84),
    squadDepth: clamp(base + swing(13), 45, 84),
    injuryImpact: clamp(14 + Math.abs(swing(14)), 8, 28),
    fatigue: clamp(18 + Math.abs(swing(15)), 10, 32),
    penaltyShootout: clamp(base + swing(16), 45, 84),
    mentalPressure: clamp(base + swing(17), 45, 84),
    tacticalFlexibility: clamp(base + swing(18), 45, 84),
    starPlayerImpact: clamp(base + swing(19), 45, 84),
    notes: ["当前为演示档案", "后续可接真实 API 更新球队数据", "评分用于模拟解释，不代表官方实力"],
  };
}

export function getTeamProfileWithAdjustments(
  englishName: string,
  adjustmentsByTeamId: Record<string, TeamSeedAdjustments>,
): TeamProfile {
  const profile = getTeamProfile(englishName);
  return applyTeamSeedAdjustments(profile, adjustmentsByTeamId[profile.id]);
}

export function applyTeamSeedAdjustments(profile: TeamProfile, adjustments?: TeamSeedAdjustments): TeamProfile {
  if (!adjustments || Object.keys(adjustments).length === 0) return profile;
  const adjusted = { ...profile };

  for (const [key, value] of Object.entries(adjustments)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (key in adjusted) {
      (adjusted as unknown as Record<string, number>)[key] = clamp(Math.round(value), 0, 100);
    }
  }

  return {
    ...adjusted,
    notes: [...profile.notes.filter((note) => note !== "已应用自定义种子参数"), "已应用自定义种子参数"],
  };
}

function hash(value: string): number {
  return [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
