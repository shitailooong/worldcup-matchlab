import type { AppView } from "../types";

type Props = {
  activeView: AppView;
  onChange: (view: AppView) => void;
};

export function TopNav({ activeView, onChange }: Props) {
  return (
    <nav className="top-nav" aria-label="主菜单">
      <button className={activeView === "beginner" ? "active" : ""} type="button" onClick={() => onChange("beginner")}>
        小白模式
      </button>
      <button className={activeView === "schedule" ? "active" : ""} type="button" onClick={() => onChange("schedule")}>
        赛程
      </button>
      <button className={activeView === "predict" ? "active" : ""} type="button" onClick={() => onChange("predict")}>
        进阶模拟
      </button>
      <button className={activeView === "seed" ? "active" : ""} type="button" onClick={() => onChange("seed")}>
        种子调整
      </button>
    </nav>
  );
}
