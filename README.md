# worldcup-matchlab

「世界杯助手 MatchLab」是一个面向普通用户的 H5 世界杯助手。用户先用小白观赛模式看懂比赛，再进入赛程、进阶模拟和种子调整做更深入的情景分析。

这个工具不是赌球工具，不提供投注建议，只做数据解释、情景模拟和小红书内容展示。当前为演示数据，可后续接入真实 API。

## 功能

- 8 支球队 mock 数据：法国、葡萄牙、巴西、阿根廷、英格兰、西班牙、德国、荷兰。
- 赛程页：优先从 `https://worldcup26.ir/get/games` 在线获取 2026 世界杯赛程。
- 本地兜底：内置 104 场赛程，在线源失败时仍可使用。
- 默认首页：小白观赛模式，展示今日推荐、入门解释、观察点和聊天话题。
- 顶部横栏菜单：小白模式 / 赛程 / 进阶模拟 / 种子调整。
- 进阶模拟页：基于用户在赛程图中点击的比赛自动带入双方球队。
- 一分钟看懂这场：把比赛风格、重点问题和故事线翻译成普通人能理解的话。
- 三个观察点：告诉小白比赛中先看什么，而不是一上来讲复杂术语。
- 看球不尴尬话题卡：生成 5 个适合朋友聊天的问题。
- 足球术语翻译器：内置越位、补时、VAR、高位压迫、xG、淘汰赛等常见术语。
- 比赛中提示器：支持 0:0、一方领先、红牌、最后 15 分钟、加时、点球大战等场景提示。
- 赛后普通人复盘：输入比分和少量事件，生成普通人能看懂的赛后总结。
- 小白观赛分享卡：适合小红书截图分享。
- 种子调整：从当前赛程自动汇总参赛国家，可调整各国家的整体实力、攻防、状态、体能、伤停、点球等模拟输入参数。
- 赛程搜索：支持按球队、日期、小组、阶段快速过滤。
- 多维预测过程：基础实力、近期状态、进攻破防、中场控制、反击空间、定位球、防守门将、稳定性。
- 流程式推演：基础盘计算、机会质量估算、战术对位修正、稳定性扣分、概率分布输出。
- 用户自带大模型 API：用户可在预测页选择服务商和模型，并填写自己的 API Key。
- 10000 次 Monte Carlo 模拟：胜平负概率、预期进球、常见比分、大比分倾向、爆冷风险、模型信心。
- 动态解释：`getKeyFactors()` 根据当前数据差异生成关键影响因素。

## 种子调整说明

「种子调整」不会改变赛程，只会改变预测模型读取到的球队参数。适合做情景模拟，例如：

- 把某队近期状态调高，观察胜率变化。
- 把某队伤停影响调高，模拟主力缺阵。
- 把某队点球能力调高，观察淘汰赛预测变化。

调整会保存在用户自己的浏览器 `localStorage` 里，刷新后仍会保留。点击「恢复该队默认」可以只清空当前球队，点击「清空全部调整」可以恢复所有球队默认参数。

## 小白模式说明

小白模式的第一版文案由本地规则函数生成，不调用后端，也不需要 API Key。核心文件是：

```text
src/lib/beginnerMode.ts
src/lib/glossary.ts
src/components/BeginnerHome.tsx
```

后续如果要接真实 AI 生成文案，可以优先替换 `src/lib/beginnerMode.ts` 里的这些函数：

```text
getBeginnerMatchIntro()
getWatchingTips()
getConversationCard()
getLiveSituationTip()
generatePostMatchReview()
```

## 本地运行

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址，通常是：

```text
http://localhost:5173
```

## 手机上直接使用

推荐方式是把项目发布成网页，让用户直接用浏览器打开：

```text
https://你的用户名.github.io/worldcup-matchlab/
```

用户不需要安装 App，安卓用 Chrome，iPhone 用 Safari，都可以直接访问。

如果用户从 GitHub 下载 ZIP，不想安装任何开发工具，可以打开：

```text
single-file/index.html
```

这是单文件网页版本，适合直接分享和离线打开。

注意：单文件版和 GitHub Pages 属于纯静态网页，赛程和本地模拟可以用；大模型预测需要 `/api/llm-proxy` 代理接口，推荐用本地 `npm run dev` 或 Vercel 部署。

## 构建

```bash
npm run build
```

构建产物会生成在 `dist/`。

生成单文件版：

```bash
npm run build:single
```

输出位置：

```text
single-file/index.html
```

## 部署到 GitHub Pages

项目已内置 GitHub Actions：

```text
.github/workflows/deploy-pages.yml
```

推送到 GitHub 的 `main` 分支后：

1. 打开仓库 `Settings`。
2. 进入 `Pages`。
3. Source 选择 `GitHub Actions`。
4. 等待 Actions 跑完。
5. 用户就可以用手机浏览器直接打开 GitHub Pages 链接。

## 部署到 Vercel

1. 把本项目推到 GitHub。
2. 打开 Vercel，选择 `Add New Project`。
3. 导入这个 GitHub 仓库。
4. Vercel 会自动识别 Vite 项目。
5. 保持默认设置：
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 点击 Deploy。

项目已包含：

```text
api/llm-proxy.js
```

部署到 Vercel 后，大模型预测会通过这个同源接口转发，避免手机浏览器直接请求第三方 API 时出现 `Failed to fetch`。

## 用户自带大模型 API

预测页支持用户选择主流大模型服务商，不使用项目作者的 API Key。

填写项：

- 服务商：OpenAI、DeepSeek、小米 MiMo、通义千问 / 阿里百炼、Kimi、智谱 GLM、火山方舟、硅基流动、OpenRouter
- 模型：根据服务商自动给出可选模型
- API Key：用户自己的 Key

这些设置只保存在用户自己的浏览器 `localStorage` 里。点击“用大模型预测”后，页面会先调用当前网页自己的代理接口：

```text
/api/llm-proxy
```

代理接口再转发到所选服务商的：

```text
{服务商地址}/chat/completions
```

这样可以避开浏览器跨域限制。适合用户自己本地运行或自己部署到 Vercel 使用；如果作者统一托管给所有用户使用，需要在页面或文档里明确提示：用户输入的 API Key 会经过该托管站点的代理接口。

内置服务商地址来自各家官方或平台文档：

- OpenAI: https://platform.openai.com/docs/api-reference/chat/create
- DeepSeek: https://api-docs.deepseek.com/
- 小米 MiMo: https://www.mimo-v2.com/zh/docs/api/chat/openai-api
- 通义千问 / 阿里百炼: https://help.aliyun.com/zh/model-studio/use-qwen-by-calling-api
- Kimi: https://platform.kimi.ai/docs/api/overview
- 智谱 GLM: https://docs.bigmodel.cn/cn/guide/develop/openai/introduction
- 火山方舟 / Doubao: https://www.volcengine.com/docs/82379/1330626
- 硅基流动: https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions
- OpenRouter: https://openrouter.ai/docs/api/reference/overview

小米 MiMo 在部分网络下访问官方 `api.mimo-v2.com` 可能会连接失败，项目内已为小米选项加入 `api.xiaomimimo.com` 自动备用域名。

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
src/lib/llmSimulation.ts # 用户自带大模型 API 调用
src/data/teams.ts       # 8 支球队 mock 数据
src/types.ts            # 全局类型
src/App.tsx             # 页面状态和主流程
src/components/*        # 页面组件
src/index.css           # 全局样式
```
