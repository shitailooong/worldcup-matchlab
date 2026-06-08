import type { TeamProfile } from "../types";

type Props = {
  teams: TeamProfile[];
  teamAId: string;
  teamBId: string;
  onTeamAChange: (id: string) => void;
  onTeamBChange: (id: string) => void;
};

export function TeamSelector({ teams, teamAId, teamBId, onTeamAChange, onTeamBChange }: Props) {
  return (
    <section className="card selector-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Teams</p>
          <h2>选择比赛双方</h2>
        </div>
        <span>8 支演示球队</span>
      </div>
      <div className="selector-grid">
        <label>
          Team A
          <select value={teamAId} onChange={(event) => onTeamAChange(event.target.value)}>
            {teams.map((team) => (
              <option key={team.id} value={team.id} disabled={team.id === teamBId}>
                {team.flagEmoji} {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Team B
          <select value={teamBId} onChange={(event) => onTeamBChange(event.target.value)}>
            {teams.map((team) => (
              <option key={team.id} value={team.id} disabled={team.id === teamAId}>
                {team.flagEmoji} {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
