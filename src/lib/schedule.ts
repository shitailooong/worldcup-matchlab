import { fallbackMatches } from "../data/fallbackMatches";
import type { MatchFixture } from "../types";

const API_URL = "https://worldcup26.ir/get/games";

type ApiGame = {
  id: string;
  home_score?: string;
  away_score?: string;
  group?: string;
  matchday?: string;
  local_date?: string;
  stadium_id?: string;
  finished?: string;
  time_elapsed?: string;
  type?: string;
  home_team_name_en: string;
  away_team_name_en: string;
};

export async function fetchWorldCupSchedule(): Promise<MatchFixture[]> {
  const response = await fetch(API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Schedule API failed: ${response.status}`);
  const data = (await response.json()) as { games?: ApiGame[] };
  if (!Array.isArray(data.games) || data.games.length === 0) throw new Error("Schedule API returned no games");
  return data.games.map(normalizeGame).sort(sortMatches);
}

export function getFallbackSchedule(): MatchFixture[] {
  return [...fallbackMatches].sort(sortMatches);
}

export function sortMatches(a: MatchFixture, b: MatchFixture): number {
  return parseMatchDate(a.dateTime).getTime() - parseMatchDate(b.dateTime).getTime();
}

export function parseMatchDate(value: string): Date {
  const [datePart, timePart = "00:00"] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function formatMatchDate(value: string): string {
  const date = parseMatchDate(value);
  const dateText = `${date.getMonth() + 1}.${date.getDate()}`;
  const timeText = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return `${dateText} ${timeText}`;
}

function normalizeGame(game: ApiGame): MatchFixture {
  return {
    id: String(game.id),
    dateTime: game.local_date || "",
    group: game.group || "",
    matchday: String(game.matchday || ""),
    type: game.type || "group",
    home: game.home_team_name_en,
    away: game.away_team_name_en,
    homeScore: Number(game.home_score || 0),
    awayScore: Number(game.away_score || 0),
    finished: String(game.finished).toUpperCase() === "TRUE",
    status: game.time_elapsed || "notstarted",
    stadiumId: String(game.stadium_id || ""),
  };
}
