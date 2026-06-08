import { useMemo, useState } from "react";
import { formatMatchDate } from "../lib/schedule";
import { getDisplayName } from "../lib/teamProfiles";
import type { MatchFixture, ScheduleSourceStatus } from "../types";

type Props = {
  matches: MatchFixture[];
  selectedMatchId: string;
  sourceStatus: ScheduleSourceStatus;
  compact?: boolean;
  onSelect: (match: MatchFixture) => void;
};

export function ScheduleBoard({ matches, selectedMatchId, sourceStatus, compact, onSelect }: Props) {
  const [mapMode, setMapMode] = useState<"poster" | "overview" | "list">("poster");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredMatches = useMemo(() => filterMatches(matches, searchQuery), [matches, searchQuery]);
  const grouped = groupMatches(filteredMatches);
  const stageBuckets = useMemo(() => groupByStage(filteredMatches), [filteredMatches]);
  const effectiveMode = compact ? "overview" : mapMode;
  const matchCountText = searchQuery.trim() ? `${filteredMatches.length}/${matches.length}` : String(matches.length);
  const sourceText =
    sourceStatus === "online" ? "实时赛程源" : sourceStatus === "loading" ? "正在更新" : "本地兜底赛程";

  return (
    <section className={`card schedule-board ${compact ? "compact" : ""}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>世界杯赛程对阵图</h2>
        </div>
        <span>{sourceText} · {matchCountText} 场</span>
      </div>

      <div className="schedule-search">
        <label>
          <span>搜索赛程</span>
          <input
            aria-label="搜索赛程"
            placeholder="搜球队、日期、小组、阶段"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            清除
          </button>
        )}
      </div>

      {!compact && (
        <div className="schedule-controls" aria-label="赛程显示方式">
          <button className={mapMode === "poster" ? "active" : ""} type="button" onClick={() => setMapMode("poster")}>
            海报图
          </button>
          <button className={mapMode === "list" ? "active" : ""} type="button" onClick={() => setMapMode("list")}>
            列表
          </button>
          <button
            className={mapMode === "overview" ? "active" : ""}
            type="button"
            onClick={() => setMapMode("overview")}
          >
            纵览
          </button>
        </div>
      )}

      {effectiveMode === "poster" && (
        <FullPoster matches={filteredMatches} selectedMatchId={selectedMatchId} onSelect={onSelect} />
      )}

      {effectiveMode === "overview" && (
        <div className="poster-viewport">
          <div className="poster-map">
            {stageBuckets.map((stage) => (
              <div className="poster-stage" key={stage.title}>
                <div className="poster-stage-title">
                  <span>{stage.title}</span>
                  <strong>{stage.matches.length}</strong>
                </div>
                <div className="poster-date-row">
                  {Object.entries(groupMatches(stage.matches)).map(([bucket, items]) => (
                    <div className="poster-date-col" key={`${stage.title}-${bucket}`}>
                      <h3>{bucket}</h3>
                      {items.map((match) => (
                        <FixtureCard
                          key={match.id}
                          match={match}
                          selected={match.id === selectedMatchId}
                          onSelect={onSelect}
                          variant="mini"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {effectiveMode === "list" && (
        <div className="schedule-window">
          {Object.entries(grouped).map(([bucket, items]) => (
            <div className="schedule-day" key={bucket}>
              <h3>{bucket}</h3>
              <div className="match-grid">
                {items.map((match) => (
                  <FixtureCard key={match.id} match={match} selected={match.id === selectedMatchId} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredMatches.length === 0 && (
        <div className="empty-schedule">
          没有找到相关赛程，可以试试球队名、A组、32强、决赛或日期。
        </div>
      )}
      <p className="schedule-note">在线源：worldcup26.ir/get/games；若浏览器跨域或网络失败，会自动显示内置 104 场赛程。</p>
    </section>
  );
}

function FullPoster({
  matches,
  selectedMatchId,
  onSelect,
}: {
  matches: MatchFixture[];
  selectedMatchId: string;
  onSelect: (match: MatchFixture) => void;
}) {
  const groupLetters = "ABCDEFGHIJKL".split("");
  const groupMatchesByLetter = matches
    .filter((match) => normalizeStage(match.type) === "group")
    .reduce<Record<string, MatchFixture[]>>((groups, match) => {
      groups[match.group] ||= [];
      groups[match.group].push(match);
      return groups;
    }, {});
  const knockoutStages = groupByStage(matches).filter((stage) => stage.title !== "小组赛");

  return (
    <div className="full-poster-frame">
      <div className="full-poster-head">
        <div>
          <p>FIFA WORLD CUP 2026</p>
          <h3>完整赛程海报</h3>
        </div>
        <strong>{matches.length} MATCHES</strong>
      </div>

      <div className="group-poster-grid">
        {groupLetters.map((letter) => (
          <div className="group-column" key={letter}>
            <h4>{letter}组</h4>
            {(groupMatchesByLetter[letter] || []).map((match) => (
              <PosterMatchTile
                key={match.id}
                match={match}
                selected={match.id === selectedMatchId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="knockout-poster">
        {knockoutStages.map((stage) => (
          <div className="knockout-row" key={stage.title}>
            <div className="knockout-label">
              <span>{stage.title}</span>
              <strong>{stage.matches.length}</strong>
            </div>
            <div className="knockout-tiles">
              {stage.matches.map((match) => (
                <PosterMatchTile
                  key={match.id}
                  match={match}
                  selected={match.id === selectedMatchId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PosterMatchTile({
  match,
  selected,
  onSelect,
}: {
  match: MatchFixture;
  selected: boolean;
  onSelect: (match: MatchFixture) => void;
}) {
  return (
    <button className={selected ? "poster-match active" : "poster-match"} type="button" onClick={() => onSelect(match)}>
      <span>{formatMatchDate(match.dateTime)}</span>
      <strong>{getDisplayName(match.home)}</strong>
      <i>vs</i>
      <strong>{getDisplayName(match.away)}</strong>
    </button>
  );
}

function FixtureCard({
  match,
  selected,
  onSelect,
  variant,
}: {
  match: MatchFixture;
  selected: boolean;
  onSelect: (match: MatchFixture) => void;
  variant?: "mini";
}) {
  return (
    <button
      className={`${selected ? "fixture-card active" : "fixture-card"} ${variant === "mini" ? "mini" : ""}`}
      type="button"
      onClick={() => onSelect(match)}
    >
      <div className="fixture-meta">
        <span>{formatMatchDate(match.dateTime)}</span>
        <span>{match.type === "group" ? `${match.group}组` : getStageTitle(match.type)}</span>
      </div>
      <div className="fixture-teams">
        <strong>{getDisplayName(match.home)}</strong>
        <i>vs</i>
        <strong>{getDisplayName(match.away)}</strong>
      </div>
      <small>{match.finished ? `${match.homeScore}-${match.awayScore}` : `第 ${match.matchday || "-"} 轮`}</small>
    </button>
  );
}

function groupMatches(matches: MatchFixture[]): Record<string, MatchFixture[]> {
  return matches.reduce<Record<string, MatchFixture[]>>((groups, match) => {
    const key = match.dateTime ? match.dateTime.split(" ")[0] : "待定";
    groups[key] ||= [];
    groups[key].push(match);
    return groups;
  }, {});
}

function filterMatches(matches: MatchFixture[], query: string): MatchFixture[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return matches;
  return matches.filter((match) => normalizeSearchText(getSearchText(match)).includes(normalizedQuery));
}

function getSearchText(match: MatchFixture): string {
  const homeName = getDisplayName(match.home);
  const awayName = getDisplayName(match.away);
  const stage = getStageTitle(match.type);
  return [
    match.id,
    match.home,
    match.away,
    homeName,
    awayName,
    `${homeName}vs${awayName}`,
    `${awayName}vs${homeName}`,
    match.group,
    `${match.group}组`,
    match.matchday,
    `第${match.matchday}轮`,
    match.dateTime,
    formatMatchDate(match.dateTime),
    match.type,
    stage,
  ].join(" ");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[｜|:：/\\._-]/g, "");
}

function groupByStage(matches: MatchFixture[]): Array<{ title: string; matches: MatchFixture[] }> {
  const stageOrder = ["group", "round-of-32", "round-of-16", "quarter-final", "semi-final", "third-place", "final"];
  const groups = matches.reduce<Record<string, MatchFixture[]>>((acc, match) => {
    const key = normalizeStage(match.type);
    acc[key] ||= [];
    acc[key].push(match);
    return acc;
  }, {});

  return stageOrder
    .filter((stage) => groups[stage]?.length)
    .map((stage) => ({
      title: getStageTitle(stage),
      matches: groups[stage],
    }));
}

function normalizeStage(type: string): string {
  const value = type.toLowerCase();
  if (value === "r32" || value.includes("32")) return "round-of-32";
  if (value === "r16" || value.includes("16")) return "round-of-16";
  if (value === "qf" || value.includes("quarter")) return "quarter-final";
  if (value === "sf" || value.includes("semi")) return "semi-final";
  if (value === "third" || value.includes("third")) return "third-place";
  if (value === "final" || value.includes("final")) return "final";
  return "group";
}

function getStageTitle(type: string): string {
  const value = normalizeStage(type);
  const labels: Record<string, string> = {
    group: "小组赛",
    "round-of-32": "32强",
    "round-of-16": "16强",
    "quarter-final": "1/4决赛",
    "semi-final": "半决赛",
    "third-place": "三四名",
    final: "决赛",
  };
  return labels[value] || type;
}
