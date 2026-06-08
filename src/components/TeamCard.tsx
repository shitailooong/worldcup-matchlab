import type { TeamProfile } from "../types";

const metrics: Array<[keyof TeamProfile, string]> = [
  ["overallStrength", "整体实力"],
  ["recentForm", "近期状态"],
  ["attackPower", "进攻能力"],
  ["defensePower", "防守能力"],
  ["midfieldControl", "中场控制"],
  ["pressingIntensity", "压迫强度"],
  ["counterAttack", "反击速度"],
  ["setPieceAttack", "定位球进攻"],
  ["setPieceDefense", "定位球防守"],
  ["goalkeeper", "门将能力"],
  ["squadDepth", "阵容深度"],
  ["injuryImpact", "伤停影响"],
  ["fatigue", "体能疲劳"],
  ["penaltyShootout", "点球大战"],
  ["mentalPressure", "抗压能力"],
  ["tacticalFlexibility", "战术灵活"],
];

type Props = {
  team: TeamProfile;
  label: string;
};

export function TeamCard({ team, label }: Props) {
  return (
    <article className="card team-card">
      <div className="team-header">
        <div>
          <p className="eyebrow">{label}</p>
          <h2>
            <span>{team.flagEmoji}</span> {team.name}
          </h2>
          <p>{team.styleLabel}</p>
        </div>
        <strong>{team.overallStrength}</strong>
      </div>

      <div className="bar-list">
        {metrics.map(([key, labelText]) => {
          const value = Number(team[key]);
          const risk = key === "injuryImpact" || key === "fatigue";
          return (
            <div className="bar-row" key={String(key)}>
              <span>{labelText}</span>
              <div className="bar-track">
                <i style={{ width: `${value}%` }} className={risk ? "risk" : ""} />
              </div>
              <strong>{value}</strong>
            </div>
          );
        })}
      </div>

      <ul className="note-list">
        {team.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}
