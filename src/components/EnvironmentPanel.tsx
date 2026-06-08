import type { MatchContext } from "../types";

type Props = {
  context: MatchContext;
  onChange: (context: MatchContext) => void;
};

export function EnvironmentPanel({ context, onChange }: Props) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Context</p>
          <h2>比赛环境调整</h2>
        </div>
        <span>情景模拟</span>
      </div>

      <div className="form-grid">
        <label>
          比赛阶段
          <select
            value={context.matchStage}
            onChange={(event) => onChange({ ...context, matchStage: event.target.value as MatchContext["matchStage"] })}
          >
            <option value="group">小组赛</option>
            <option value="knockout">淘汰赛</option>
            <option value="final">决赛</option>
          </select>
        </label>
        <label>
          场地
          <select
            value={context.venue}
            onChange={(event) => onChange({ ...context, venue: event.target.value as MatchContext["venue"] })}
          >
            <option value="neutral">中立场</option>
            <option value="teamA_home">Team A 主场</option>
            <option value="teamB_home">Team B 主场</option>
          </select>
        </label>
        <label>
          天气
          <select
            value={context.weather}
            onChange={(event) => onChange({ ...context, weather: event.target.value as MatchContext["weather"] })}
          >
            <option value="normal">正常</option>
            <option value="hot">炎热</option>
            <option value="rainy">雨战</option>
            <option value="cold">寒冷</option>
          </select>
        </label>
        <label>
          裁判尺度
          <select
            value={context.refereeStrictness}
            onChange={(event) =>
              onChange({ ...context, refereeStrictness: event.target.value as MatchContext["refereeStrictness"] })
            }
          >
            <option value="low">宽松</option>
            <option value="medium">中等</option>
            <option value="high">严格</option>
          </select>
        </label>
      </div>

      <div className="slider-list">
        <label className="slider-row wide">
          <span>Team A 休息优势</span>
          <input
            type="range"
            min="-3"
            max="3"
            value={context.restAdvantage}
            onChange={(event) => onChange({ ...context, restAdvantage: Number(event.target.value) })}
          />
          <strong>{context.restAdvantage}</strong>
        </label>
        <label className="slider-row wide">
          <span>海拔影响</span>
          <input
            type="range"
            min="0"
            max="100"
            value={context.altitudeEffect}
            onChange={(event) => onChange({ ...context, altitudeEffect: Number(event.target.value) })}
          />
          <strong>{context.altitudeEffect}</strong>
        </label>
      </div>
    </section>
  );
}
