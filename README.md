# MatchLab｜世界杯多维球队模拟器

一个面向普通用户的 H5 足球比赛模拟器。用户可以选择两支世界杯球队，查看多维球队数据，手动调整权重和比赛环境，然后一键模拟 10000 次比赛走势。

这个工具不是赌球工具，不提供投注建议，只做数据解释、情景模拟和小红书内容展示。当前为演示数据，可后续接入真实 API。

## 功能

- 8 支球队 mock 数据：法国、葡萄牙、巴西、阿根廷、英格兰、西班牙、德国、荷兰。
- 多维球队数据卡：整体实力、近期状态、进攻、防守、中场、压迫、反击、定位球、门将、阵容深度、伤停、疲劳、点球、心理压力等。
- 权重调节：所有 slider 范围 0-30，模型内部自动归一化。
- 预设权重：小白默认、进攻优先、防守优先、爆冷模式、淘汰赛模式。
- 比赛环境：阶段、场地、天气、裁判尺度、休息优势、海拔影响。
- 10000 次 Monte Carlo 模拟：胜平负概率、预期进球、常见比分、大比分倾向、爆冷风险、模型信心。
- 动态解释：`getKeyFactors()` 根据当前数据差异和权重贡献生成关键影响因素。
- 小红书分享卡：包含双方、胜平负概率、预期进球、最可能比分、一句话结论、前三条关键因素和署名。

## 本地运行

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址，通常是：

```text
http://localhost:5173
```

## 构建

```bash
npm run build
```

构建产物会生成在 `dist/`。

## 部署到 Vercel

1. 把本项目推到 GitHub。
2. 打开 Vercel，选择 `Add New Project`。
3. 导入这个 GitHub 仓库。
4. Vercel 会自动识别 Vite 项目。
5. 保持默认设置：
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 点击 Deploy。

## 后续接入真实 API

当前 mock 数据在：

```text
src/data/teams.ts
```

后续可以把它替换为 API 数据适配层：

```text
src/data/teams.ts -> src/services/teamApi.ts
```

建议真实 API 至少返回：

- 球队基础评分
- 球员伤停
- 近期比赛状态
- 首发阵容
- 赛程和休息天数
- 天气和场地信息

接入后仍然保持 `TeamProfile` 类型不变，这样模拟算法和 UI 不需要大改。

## 后续把分享卡片导出为图片

分享卡 DOM id 是：

```text
share-card
```

后续可用 `html-to-image` 或 `dom-to-image`：

```bash
npm install html-to-image
```

然后把 `#share-card` 转成 PNG 下载，适合小红书发图。

## 核心文件

```text
src/lib/simulation.ts   # 所有模拟算法
src/data/teams.ts       # 8 支球队 mock 数据
src/types.ts            # 全局类型
src/App.tsx             # 页面状态和主流程
src/components/*        # 页面组件
src/index.css           # 全局样式
```
