import { useMemo, useState } from "react";
import {
  buildRecommendation,
  generatePostMatchReview,
  getBeginnerMatchIntro,
  getConversationCard,
  getLiveSituationTip,
  getTodayRecommendations,
  getWatchingTips,
  type BeginnerRecommendation,
} from "../lib/beginnerMode";
import { explainTerm, glossaryTerms } from "../lib/glossary";
import { getDisplayName } from "../lib/teamProfiles";
import type { LiveSituation, MatchFixture, PostMatchReview, TeamProfile } from "../types";

type Props = {
  matches: MatchFixture[];
  selectedMatch: MatchFixture;
  teamA: TeamProfile;
  teamB: TeamProfile;
  onSelectMatch: (match: MatchFixture) => void;
  onOpenAdvanced: () => void;
  getTeam: (country: string) => TeamProfile;
};

const situationOptions: Array<{ id: LiveSituation; label: string }> = [
  { id: "scoreless", label: "现在 0:0" },
  { id: "one_side_leads", label: "一方领先" },
  { id: "red_card", label: "出现红牌" },
  { id: "last_15", label: "最后 15 分钟" },
  { id: "extra_time", label: "进入加时赛" },
  { id: "penalties", label: "进入点球大战" },
  { id: "boring", label: "场面很沉闷" },
  { id: "possession_no_goal", label: "一直控球但不进球" },
];

export function BeginnerHome({
  matches,
  selectedMatch,
  teamA,
  teamB,
  onSelectMatch,
  onOpenAdvanced,
  getTeam,
}: Props) {
  const recommendations = useMemo(() => getTodayRecommendations(matches, getTeam), [getTeam, matches]);
  const selectedRecommendation = buildRecommendation(selectedMatch, teamA, teamB);
  const intro = getBeginnerMatchIntro(selectedMatch, teamA, teamB);
  const watchingTips = getWatchingTips(selectedMatch, teamA, teamB);
  const conversation = getConversationCard(selectedMatch, teamA, teamB);
  const [selectedTerm, setSelectedTerm] = useState("xG / 预期进球");
  const [selectedSituation, setSelectedSituation] = useState<LiveSituation>("scoreless");
  const [teamAScore, setTeamAScore] = useState(1);
  const [teamBScore, setTeamBScore] = useState(1);
  const [firstScorer, setFirstScorer] = useState<"teamA" | "teamB" | "none">("none");
  const [hasRedCard, setHasRedCard] = useState(false);
  const [wentExtraTime, setWentExtraTime] = useState(false);
  const [wentPenalties, setWentPenalties] = useState(false);
  const [feltConfusing, setFeltConfusing] = useState(false);
  const [review, setReview] = useState<PostMatchReview | null>(null);
  const term = explainTerm(selectedTerm);

  function createReview() {
    setReview(
      generatePostMatchReview({
        match: selectedMatch,
        teamA,
        teamB,
        teamAScore,
        teamBScore,
        firstScorer,
        hasRedCard,
        wentExtraTime,
        wentPenalties,
        feltConfusing,
      }),
    );
  }

  return (
    <div className="beginner-home">
      <section className="card beginner-hero-card">
        <p className="eyebrow">Beginner Mode</p>
        <h2>今晚该看哪场？先看这三张卡</h2>
        <p>不用先懂阵型、术语和数据。先知道这场像什么、看哪里、怎么和朋友聊。</p>
        <div className="beginner-entry-actions">
          <button type="button" onClick={() => scrollToElement("beginner-match-guide")}>
            帮我看懂这场
          </button>
          <button type="button" onClick={onOpenAdvanced}>
            我想自己调参数模拟
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tonight Picks</p>
            <h2>今日推荐卡</h2>
          </div>
          <span>小白优先</span>
        </div>
        <div className="recommendation-grid">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.match.id}
              recommendation={recommendation}
              selected={recommendation.match.id === selectedMatch.id}
              onSelect={() => onSelectMatch(recommendation.match)}
            />
          ))}
        </div>
      </section>

      <section className="card beginner-guide-card" id="beginner-match-guide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">One Minute</p>
            <h2>一分钟看懂这场</h2>
          </div>
          <span>{selectedRecommendation.worthStayingUp}</span>
        </div>

        <div className="beginner-match-title">
          <h2>
            {teamA.flagEmoji} {teamA.name} vs {teamB.flagEmoji} {teamB.name}
          </h2>
          <p>{selectedRecommendation.tagline}</p>
        </div>

        <div className="intro-grid">
          <InfoBlock title="这场像什么？" body={intro.analogy} />
          <InfoBlock title={`${teamA.name}更像`} body={intro.teamAStyle} />
          <InfoBlock title={`${teamB.name}更像`} body={intro.teamBStyle} />
          <InfoBlock title="小白重点看" body={intro.focusQuestion} />
          <InfoBlock title="最可能的故事线" body={intro.likelyStory} />
          <InfoBlock title="只看一个地方" body={intro.oneThingToWatch} />
        </div>

        <div className="beginner-summary-line">{intro.summary}</div>
      </section>

      <section className="beginner-two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Watch Points</p>
              <h2>三个观察点</h2>
            </div>
          </div>
          <div className="watch-tip-list">
            {watchingTips.map((tip, index) => (
              <article key={tip.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{tip.title}</h3>
                  <p>{tip.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Talk Card</p>
              <h2>看球不尴尬话题卡</h2>
            </div>
          </div>
          <ol className="conversation-list">
            {conversation.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="beginner-two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Glossary</p>
              <h2>足球术语翻译器</h2>
            </div>
          </div>
          <div className="glossary-layout">
            <select value={selectedTerm} onChange={(event) => setSelectedTerm(event.target.value)}>
              {glossaryTerms.map((item) => (
                <option key={item.term} value={item.term}>
                  {item.term}
                </option>
              ))}
            </select>
            <div className="glossary-result">
              <h3>{term.term}</h3>
              <p>
                <strong>一句话：</strong>
                {term.shortExplanation}
              </p>
              <p>
                <strong>小白版：</strong>
                {term.beginnerExplanation}
              </p>
              <p>
                <strong>怎么识别：</strong>
                {term.howToSpot}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live Helper</p>
              <h2>比赛中提示器</h2>
            </div>
          </div>
          <div className="situation-buttons">
            {situationOptions.map((option) => (
              <button
                className={option.id === selectedSituation ? "active" : ""}
                key={option.id}
                type="button"
                onClick={() => setSelectedSituation(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="live-tip">{getLiveSituationTip(selectedSituation, selectedMatch, teamA, teamB)}</p>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">After Match</p>
            <h2>赛后普通人复盘</h2>
          </div>
        </div>
        <div className="post-review-layout">
          <div className="post-review-form">
            <label>
              {teamA.name}进球
              <input type="number" min="0" max="12" value={teamAScore} onChange={(event) => setTeamAScore(Number(event.target.value))} />
            </label>
            <label>
              {teamB.name}进球
              <input type="number" min="0" max="12" value={teamBScore} onChange={(event) => setTeamBScore(Number(event.target.value))} />
            </label>
            <label>
              谁先进球
              <select value={firstScorer} onChange={(event) => setFirstScorer(event.target.value as "teamA" | "teamB" | "none")}>
                <option value="none">不确定 / 没进球</option>
                <option value="teamA">{teamA.name}</option>
                <option value="teamB">{teamB.name}</option>
              </select>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={hasRedCard} onChange={(event) => setHasRedCard(event.target.checked)} />
              有红牌
            </label>
            <label className="check-row">
              <input type="checkbox" checked={wentExtraTime} onChange={(event) => setWentExtraTime(event.target.checked)} />
              进入加时
            </label>
            <label className="check-row">
              <input type="checkbox" checked={wentPenalties} onChange={(event) => setWentPenalties(event.target.checked)} />
              进入点球大战
            </label>
            <label className="check-row wide">
              <input type="checkbox" checked={feltConfusing} onChange={(event) => setFeltConfusing(event.target.checked)} />
              我觉得这场看不懂
            </label>
            <button className="simulate-button" type="button" onClick={createReview}>
              生成赛后复盘
            </button>
          </div>

          <div className="post-review-result">
            {review ? (
              <>
                <InfoBlock title="这场发生了什么" body={review.whatHappened} />
                <InfoBlock title="关键转折" body={review.turningPoint} />
                <InfoBlock title="谁踢得更好" body={review.betterTeam} />
                <InfoBlock title="比分是否反映内容" body={review.scoreReflection} />
                <InfoBlock title="这场结果说明什么" body={review.meaning} />
                <InfoBlock title="朋友圈文案" body={review.socialCaption} />
              </>
            ) : (
              <div className="empty-review">输入比分后，生成一段普通人也能看懂的赛后复盘。</div>
            )}
          </div>
        </div>
      </section>

      <section className="share-section beginner-share-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Share Card</p>
            <h2>小白观赛卡</h2>
          </div>
          <span>截图即用</span>
        </div>
        <article className="share-card beginner-share-card" id="beginner-share-card">
          <p className="share-kicker">世界杯小白观赛卡</p>
          <h2>
            {teamA.flagEmoji} {teamA.name} vs {teamB.flagEmoji} {teamB.name}
          </h2>
          <div className="watch-rating">推荐观看指数：{renderStars(selectedRecommendation.rating)}</div>
          <p className="share-conclusion">{selectedRecommendation.tagline}</p>
          <ol>
            {watchingTips.map((tip) => (
              <li key={tip.title}>{tip.title}</li>
            ))}
          </ol>
          <div className="share-chat-question">{conversation.questions[0]}</div>
          <footer>由「施泰隆｜AI生活实验」生成</footer>
        </article>
      </section>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  selected,
  onSelect,
}: {
  recommendation: BeginnerRecommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  const matchName = `${getDisplayName(recommendation.match.home)} vs ${getDisplayName(recommendation.match.away)}`;
  return (
    <button className={selected ? "recommendation-card active" : "recommendation-card"} type="button" onClick={onSelect}>
      <span>{renderStars(recommendation.rating)}</span>
      <h3>{matchName}</h3>
      <p>{recommendation.reason}</p>
      <strong>{recommendation.tagline}</strong>
      <small>{recommendation.worthStayingUp}</small>
      <div>
        {recommendation.tags.map((tag) => (
          <i key={tag}>{tag}</i>
        ))}
      </div>
    </button>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <article className="info-block">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function renderStars(rating: number): string {
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function scrollToElement(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
