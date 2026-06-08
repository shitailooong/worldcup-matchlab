import type { GlossaryTerm } from "../types";

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "越位",
    shortExplanation: "进攻球员接球时，站得比倒数第二名防守球员还靠近球门。",
    beginnerExplanation: "可以理解成不能提前蹲在对方门口等传球，需要和防守线保持相对公平的位置。",
    howToSpot: "进球后如果边裁举旗或 VAR 画线，大概率是在看越位。",
  },
  {
    term: "补时",
    shortExplanation: "把伤停、换人、VAR 等耽误的时间补回来。",
    beginnerExplanation: "90 分钟到了不一定马上结束，裁判会把浪费掉的时间加回去。",
    howToSpot: "上下半场结束前，场边会举牌显示补几分钟。",
  },
  {
    term: "加时赛",
    shortExplanation: "淘汰赛打平后，再踢两个 15 分钟。",
    beginnerExplanation: "这不是补时，而是额外多踢半小时来分胜负。",
    howToSpot: "常规时间结束还是平局，镜头会提示进入加时赛。",
  },
  {
    term: "点球大战",
    shortExplanation: "加时后仍打平，双方轮流罚点球决定胜负。",
    beginnerExplanation: "这更像心理和门将的对决，不完全等于整场谁踢得更好。",
    howToSpot: "球员从中圈排队，一个个走向点球点。",
  },
  {
    term: "VAR",
    shortExplanation: "视频助理裁判，用回放帮助主裁判断关键判罚。",
    beginnerExplanation: "它主要看进球、点球、红牌、认错人这类大事。",
    howToSpot: "主裁做出看屏幕手势，或跑到场边小屏幕前回看。",
  },
  {
    term: "高位压迫",
    shortExplanation: "在对方半场就开始逼抢，不让对手舒服出球。",
    beginnerExplanation: "像是在对方刚拿球时就围上去，逼他仓促传球或失误。",
    howToSpot: "看对方门将或后卫拿球时，前锋是不是马上冲上去抢。",
  },
  {
    term: "反击",
    shortExplanation: "抢到球后快速往前打，利用对手身后空间。",
    beginnerExplanation: "不是慢慢组织，而是趁对方还没站好，马上冲过去。",
    howToSpot: "一断球就长传或快速推进，几秒内就到对方禁区附近。",
  },
  {
    term: "定位球",
    shortExplanation: "角球、任意球、点球这类从固定位置重新开球的机会。",
    beginnerExplanation: "它经常让弱队也能制造威胁，因为大家都提前站好位置。",
    howToSpot: "比赛暂停后，球被摆在固定点，双方球员在禁区里抢位置。",
  },
  {
    term: "控球率",
    shortExplanation: "一支队掌控球权的时间比例。",
    beginnerExplanation: "控球多不一定更危险，只能说明球在它脚下更久。",
    howToSpot: "转播数据会显示百分比，但要结合有没有进禁区看。",
  },
  {
    term: "xG / 预期进球",
    shortExplanation: "衡量一次机会本来有多大概率进球。",
    beginnerExplanation: "它不是实际进球数，而是这支队创造出来的机会质量。",
    howToSpot: "射门很多但 xG 低，通常说明看起来热闹，真正危险的机会不多。",
  },
  {
    term: "射正",
    shortExplanation: "射门打在门框范围内，并需要门将或防守球员处理。",
    beginnerExplanation: "射偏不算射正，被门将扑住、打进或门线解围才算。",
    howToSpot: "看球是不是朝球门范围去，而不是飞上看台或偏出底线。",
  },
  {
    term: "禁区触球",
    shortExplanation: "球员在对方禁区内碰到球的次数。",
    beginnerExplanation: "它比普通控球更接近危险区域，能说明有没有真正打进去。",
    howToSpot: "看一队是不是经常把球送进对方大禁区，而不只是在外围传。",
  },
  {
    term: "净胜球",
    shortExplanation: "进球数减去丢球数。",
    beginnerExplanation: "小组赛积分相同时，净胜球可能决定谁出线。",
    howToSpot: "如果两队积分接近，解说常会提到还差几个净胜球。",
  },
  {
    term: "小组出线",
    shortExplanation: "从小组赛晋级到淘汰赛。",
    beginnerExplanation: "世界杯不是每队都能一直踢，先要从小组里活下来。",
    howToSpot: "看积分榜排名、积分、净胜球和最后一轮对手。",
  },
  {
    term: "淘汰赛",
    shortExplanation: "输球就出局的阶段。",
    beginnerExplanation: "从这里开始容错率很低，球队通常会更谨慎。",
    howToSpot: "比赛打平会进入加时，甚至点球大战。",
  },
];

export function explainTerm(term: string): GlossaryTerm {
  const normalized = normalize(term);
  return (
    glossaryTerms.find((item) => normalize(item.term).includes(normalized) || normalized.includes(normalize(item.term))) ||
    glossaryTerms[0]
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}
