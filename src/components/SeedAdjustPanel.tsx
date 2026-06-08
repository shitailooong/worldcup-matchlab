import { useEffect, useMemo, useState } from "react";
import { applyTeamSeedAdjustments, getDisplayName, getTeamProfile } from "../lib/teamProfiles";
import type { MatchFixture, TeamProfile, TeamSeedAdjustmentMap, TeamSeedMetric } from "../types";

type SeedMetricConfig = {
  key: TeamSeedMetric;
  label: string;
  note: string;
  risk?: boolean;
};

const seedSections: Array<{ title: string; metrics: SeedMetricConfig[] }> = [
  {
    title: "基础种子",
    metrics: [
      { key: "overallStrength", label: "整体实力", note: "决定预测基础盘" },
      { key: "recentForm", label: "近期状态", note: "修正纸面实力" },
      { key: "squadDepth", label: "阵容深度", note: "影响长赛程稳定性" },
      { key: "starPlayerImpact", label: "球星影响", note: "影响关键球上限" },
    ],
  },
  {
    title: "攻防结构",
    metrics: [
      { key: "attackPower", label: "进攻能力", note: "影响预期进球" },
      { key: "defensePower", label: "防守能力", note: "压低对手机会" },
      { key: "midfieldControl", label: "中场控制", note: "影响控球持续性" },
      { key: "goalkeeper", label: "门将能力", note: "影响射门转化率" },
    ],
  },
  {
    title: "战术种子",
    metrics: [
      { key: "pressingIntensity", label: "压迫强度", note: "影响高位逼抢收益" },
      { key: "buildUpUnderPressure", label: "抗压出球", note: "抵消对手压迫" },
      { key: "counterAttack", label: "反击速度", note: "影响身后空间威胁" },
      { key: "defensiveLineHeight", label: "防线高度", note: "越高越激进" },
      { key: "tacticalFlexibility", label: "战术灵活", note: "影响临场修正" },
    ],
  },
  {
    title: "细节与风险",
    metrics: [
      { key: "setPieceAttack", label: "定位球进攻", note: "影响小比分破局" },
      { key: "setPieceDefense", label: "定位球防守", note: "降低定位球丢球" },
      { key: "penaltyShootout", label: "点球能力", note: "淘汰赛更重要" },
      { key: "mentalPressure", label: "抗压能力", note: "影响关键局稳定性" },
      { key: "injuryImpact", label: "伤停影响", note: "越高越不利", risk: true },
      { key: "fatigue", label: "体能疲劳", note: "越高越不利", risk: true },
    ],
  },
];

type Props = {
  matches: MatchFixture[];
  adjustments: TeamSeedAdjustmentMap;
  onChange: (adjustments: TeamSeedAdjustmentMap) => void;
};

export function SeedAdjustPanel({ matches, adjustments, onChange }: Props) {
  const countries = useMemo(() => getCountriesFromMatches(matches), [matches]);
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || "France");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (countries.length > 0 && !countries.includes(selectedCountry)) {
      setSelectedCountry(countries[0]);
    }
  }, [countries, selectedCountry]);

  const baseProfile = getTeamProfile(selectedCountry);
  const selectedAdjustments = adjustments[baseProfile.id];
  const profile = applyTeamSeedAdjustments(baseProfile, selectedAdjustments);
  const seedScore = calculateSeedScore(profile);
  const adjustedTeamCount = Object.keys(adjustments).length;
  const adjustedMetricCount = selectedAdjustments ? Object.keys(selectedAdjustments).length : 0;
  const filteredCountries = countries.filter((country) => {
    const query = normalizeSearch(searchQuery);
    if (!query) return true;
    return normalizeSearch(`${country} ${getDisplayName(country)}`).includes(query);
  });

  function updateMetric(key: TeamSeedMetric, value: number) {
    const nextTeamAdjustments = { ...(adjustments[baseProfile.id] || {}) };
    if (value === baseProfile[key]) {
      delete nextTeamAdjustments[key];
    } else {
      nextTeamAdjustments[key] = value;
    }

    const nextAdjustments = { ...adjustments };
    if (Object.keys(nextTeamAdjustments).length === 0) {
      delete nextAdjustments[baseProfile.id];
    } else {
      nextAdjustments[baseProfile.id] = nextTeamAdjustments;
    }
    onChange(nextAdjustments);
  }

  function resetSelectedTeam() {
    const nextAdjustments = { ...adjustments };
    delete nextAdjustments[baseProfile.id];
    onChange(nextAdjustments);
  }

  return (
    <section className="card seed-adjust-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Seed Control</p>
          <h2>种子参数调整</h2>
        </div>
        <span>
          {countries.length} 队 · 已调整 {adjustedTeamCount} 队
        </span>
      </div>

      <div className="seed-layout">
        <aside className="seed-country-panel">
          <label>
            选择国家
            <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {getDisplayName(country)}
                </option>
              ))}
            </select>
          </label>

          <label>
            搜索国家
            <input
              type="search"
              placeholder="输入国家名"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="seed-country-list">
            {filteredCountries.map((country) => {
              const countryProfile = getTeamProfile(country);
              const isAdjusted = Boolean(adjustments[countryProfile.id]);
              return (
                <button
                  className={country === selectedCountry ? "active" : ""}
                  key={country}
                  type="button"
                  onClick={() => setSelectedCountry(country)}
                >
                  <span>
                    {countryProfile.flagEmoji} {getDisplayName(country)}
                  </span>
                  {isAdjusted && <strong>已调</strong>}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="seed-editor">
          <div className="seed-summary">
            <div>
              <p className="eyebrow">Selected Team</p>
              <h3>
                {profile.flagEmoji} {profile.name}
              </h3>
              <p>{profile.styleLabel}</p>
            </div>
            <div className="seed-score">
              <span>模拟种子值</span>
              <strong>{seedScore}</strong>
            </div>
          </div>

          <div className="seed-actions">
            <button type="button" onClick={resetSelectedTeam}>
              恢复该队默认
            </button>
            <button type="button" onClick={() => onChange({})}>
              清空全部调整
            </button>
            <span>当前队已改 {adjustedMetricCount} 项</span>
          </div>

          <p className="seed-note">
            这里调整的是演示模型输入，不代表官方排名或真实实力。伤停、疲劳、防线高度这类参数不是越高越好。
          </p>

          <div className="seed-section-list">
            {seedSections.map((section) => (
              <div className="seed-section" key={section.title}>
                <h3>{section.title}</h3>
                <div className="seed-slider-list">
                  {section.metrics.map((metric) => {
                    const value = Number(profile[metric.key]);
                    const baseValue = Number(baseProfile[metric.key]);
                    const changed = value !== baseValue;
                    return (
                      <label className={changed ? "seed-slider-row changed" : "seed-slider-row"} key={metric.key}>
                        <span>{metric.label}</span>
                        <input
                          max="100"
                          min="0"
                          type="range"
                          value={value}
                          onChange={(event) => updateMetric(metric.key, Number(event.target.value))}
                        />
                        <input
                          className={metric.risk ? "seed-value-input risk" : "seed-value-input"}
                          max="100"
                          min="0"
                          type="number"
                          value={value}
                          onChange={(event) => updateMetric(metric.key, Number(event.target.value))}
                        />
                        <small>
                          {metric.note}
                          {changed ? ` · 默认 ${baseValue}` : ""}
                        </small>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getCountriesFromMatches(matches: MatchFixture[]): string[] {
  const countries = new Set<string>();
  for (const match of matches) {
    if (isKnownCountry(match.home)) countries.add(match.home);
    if (isKnownCountry(match.away)) countries.add(match.away);
  }
  return [...countries].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "zh-Hans-CN"));
}

function isKnownCountry(value: string): boolean {
  return Boolean(value && value.toUpperCase() !== "TBD");
}

function calculateSeedScore(profile: TeamProfile): number {
  const score =
    profile.overallStrength * 0.2 +
    profile.attackPower * 0.12 +
    profile.defensePower * 0.12 +
    profile.midfieldControl * 0.11 +
    profile.recentForm * 0.1 +
    profile.goalkeeper * 0.08 +
    profile.squadDepth * 0.08 +
    profile.mentalPressure * 0.07 +
    profile.tacticalFlexibility * 0.06 +
    profile.penaltyShootout * 0.04 +
    profile.starPlayerImpact * 0.04 -
    profile.injuryImpact * 0.05 -
    profile.fatigue * 0.04;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}
