import type { WeightSettings } from "../types";

const weightLabels: Array<[keyof WeightSettings, string]> = [
  ["overallStrength", "整体实力"],
  ["recentForm", "近期状态"],
  ["attackPower", "进攻能力"],
  ["defensePower", "防守能力"],
  ["midfieldControl", "中场控制"],
  ["injuryImpact", "球员伤停"],
  ["fatigue", "体能疲劳"],
  ["tacticalMatchup", "战术克制"],
  ["setPiece", "定位球"],
  ["goalkeeper", "门将"],
  ["penaltyShootout", "点球能力"],
  ["mentalPressure", "心理压力"],
];

type Props = {
  weights: WeightSettings;
  presets: Record<string, WeightSettings>;
  onChange: (weights: WeightSettings) => void;
  onReset: () => void;
};

export function WeightPanel({ weights, presets, onChange, onReset }: Props) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  function updateWeight(key: keyof WeightSettings, value: number) {
    onChange({ ...weights, [key]: value });
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Weights</p>
          <h2>用户权重调整</h2>
        </div>
        <span>总和 {total}</span>
      </div>

      <div className="preset-row">
        {Object.entries(presets).map(([name, preset]) => (
          <button key={name} type="button" onClick={() => onChange(preset)}>
            {name}
          </button>
        ))}
        <button type="button" onClick={onReset}>
          恢复默认权重
        </button>
      </div>

      <div className="slider-list">
        {weightLabels.map(([key, label]) => (
          <label className="slider-row" key={key}>
            <span>{label}</span>
            <input
              type="range"
              min="0"
              max="30"
              value={weights[key]}
              onChange={(event) => updateWeight(key, Number(event.target.value))}
            />
            <strong>{weights[key]}</strong>
          </label>
        ))}
      </div>
    </section>
  );
}
