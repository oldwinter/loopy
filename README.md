# Loop Library

本仓库包含两个彼此独立但相关的部分：

| 部分 | 它是什么 | 位置 |
| --- | --- | --- |
| **Loop Library 网站** | 公开目录。人和 agent 可以在这里浏览已发布的 loop、阅读说明并复制提示词。无需安装。 | [线上网站](https://signals.forwardfuture.com/loop-library/) · 网站代码都在 [`loop-library/`](loop-library/) 下：shell 在 [`loop-library/site/`](loop-library/site/)，数据库和渲染逻辑在 [`loop-library/worker/`](loop-library/worker/) |
| **Loopy 技能** | 可选安装的 agent 指南，帮助 AI agent 发现、查找、审计、修复、改写、设计、运行、复盘 loop，或准备发布到目录。它在推荐或发布 loop 时会使用网站的实时目录。 | 源码位于 [`skills/loopy/`](skills/loopy/) |

网站就是这个库本身；Loopy 是配套的工作方式。你可以直接浏览网站，
也可以把网站交给 agent 使用，而不必安装 Loopy。安装 Loopy 会增加
引导式工作流，但不会安装或托管网站。

没有 Loopy 的 agent 可以直接使用已发布的
[agent 指南](https://signals.forwardfuture.com/loop-library/agents/)、
[agent 指令](https://signals.forwardfuture.com/loop-library/llms.txt)、
[JSON 目录](https://signals.forwardfuture.com/loop-library/catalog.json)，或
[纯文本目录](https://signals.forwardfuture.com/loop-library/catalog.txt)。

每个已发布的 loop 都会告诉 agent：要做什么、如何检查结果、下一步尝试什么，
以及什么时候停止。

## 什么是 loop？

多数提示词 只要求 agent 做一次事。loop 则给 agent 一套方式，让它能从结果中
学习，并继续采取下一个有用步骤。

例如，一次性提示词 可能会说：

> 让这个网站更快。

loop 会加入反馈，让这项工作可以重复执行：

> 找出最慢的页面，做一个聚焦的改进，然后再次测量。
> 只有在结果变好时才保留改动。重复执行，直到每个页面都达到目标，
> 或者下一轮不再产生有意义的改进。

可以把 loop 理解成内置反馈的行动手册。它适合第一次尝试很可能不是最终答案的
工作，例如修复生产错误、提升测试覆盖率、评审产品，或持续维护文档。

一个好的 loop 会回答四个简单问题：

- agent 要完成什么？
- 它如何知道最近一次尝试是否有效？
- 它应该如何使用刚学到的信息？
- 它什么时候应该结束或请求帮助？

## 为什么 loop 有用

AI agent 可以快速行动，但像“持续改进这个”这样的开放指令会留下太多猜测空间。
loop 为工作提供清晰终点，以及稳定判断进展的方式。

这让结果更可信，也更容易复用。agent 可以比较结果，而不是依赖自信；保留改进，
而不是只做改动；并在成功或不再有进展时停止。同一个 loop 也可以交给另一个人或
agent 使用，而无需从零重建工作流。

loop 不是允许 agent 永远运行的许可。最好的 loop 都是有意设边界的。它们包含真实
检查、明确停止点，以及在需要判断或批准时把控制权交还给人的时刻。

## Loopy 能做什么

Loopy 让你的 agent 直接使用 Loop Library 里的思路。你可以用它来：

- 在代码库、编码线程或两者中发现重复工作，并把最强的合格候选项转成 loop。
- 查找适合当前目标的已发布 loop。
- 审计现有 loop 是否有薄弱检查、不安全动作或不清晰的停止行为，并且只修复实质问题。
- 按你的工具、限制和成功定义改写一个有用的 loop。
- 用简短、直白的对话访谈你想达成什么、成功是什么样子，然后创建新的有界 loop。
- 在有限轮次中运行 loop，并返回包含动作、证据、结果和停止原因的回执。
- 复盘已完成的运行，并推荐最小的、由证据支持的改进。
- 检查 loop 是否与目录重叠，准备发布草稿，并只在你批准精确预览后提交。
- 把结果转成可以立刻使用的紧凑提示词。

Loopy 推荐已发布 loop 时会检查实时目录。它不会悄悄开始计划任务、修改生产环境、
发布内容或替你发送消息。这些动作仍然需要正常权限和批准。

## 安装 Loopy

你需要 Node.js 和 `npx`。请选择你使用的平台：

| 平台 | 安装命令 |
| --- | --- |
| Codex | `npx skills add oldwinter/loopy --skill loopy --agent codex -g -y` |
| Cursor | `npx skills add oldwinter/loopy --skill loopy --agent cursor -g -y` |
| Claude Code | `npx skills add oldwinter/loopy --skill loopy --agent claude-code -g -y` |

要一次安装到三个平台：

```bash
npx skills add oldwinter/loopy \
  --skill loopy \
  --agent codex \
  --agent cursor \
  --agent claude-code \
  -g -y
```

使用其他 agent？运行交互式安装器，并从它检测到的 agent 中选择：

```bash
npx skills add oldwinter/loopy --skill loopy -g
```

命令各部分含义如下：

- `oldwinter/loopy` 是要从中安装的 GitHub 仓库。
- `--skill loopy` 从仓库中选择这个 skill。
- `--agent ...` 选择接收它的 agent。
- `-g` 让它在所有项目中可用。去掉 `-g` 则只安装到当前项目。
- `-y` 接受安装提示。去掉它即可交互式检查选项。

如果某个 agent 已经打开但看不到 Loopy，请重启该 agent。

之前的 `loop-library` skill 名称仍作为兼容别名保留，以支持已有安装。
所有新安装和显式调用都应使用 `loopy`。

## 调用 Loopy

不同平台的斜杠命令体验略有不同：

- **Codex：** 输入 `/skills`，选择 **Loopy**，然后输入你的请求。
  也可以直接用 `$loopy` 提及它。
- **Cursor：** 在 Agent chat 中输入 `/`，搜索 `loopy`，选中它并加入你的请求。
  也可以直接输入 `/loopy`。
- **Claude Code：** 输入 `/loopy`，后接你的请求。

你也可以正常描述一个匹配的任务。这些 agent 可以在请求明显适合时自动加载 Loopy，
但显式调用是最可预测的启动方式。

例如，在 Codex 中可以这样写：

```text
$loopy 分析这个代码库和我的编码线程，找出重复工作，并把最强的候选项转成可靠的 loop。
```

## 使用 Loopy

你不需要懂 loop 术语。调用 Loopy，并说出你想完成什么。它可以走八条路径：

| 路径 | 它会做什么 | 示例请求 |
| --- | --- | --- |
| **Discover** | 检查授权范围内的代码库、编码线程历史或两者，寻找重复工作，并把最强的合格候选项转成有边界的 loop。 | `分析这个仓库和我的编码线程，找出我们做过不止一次的工作。把最佳候选项转成一个 loop。` |
| **Find** | 搜索实时目录并推荐最多三个已发布 loop。它不会运行这些 loop。 | `找一个用于保持文档最新的已发布 loop。` |
| **Loop Doctor** | 审计你粘贴或点名的 loop，解释实质弱点，并只修复这些问题。 | `审计这个 loop，并只修复实质问题：[粘贴 loop]` |
| **Adapt** | 从已发布 loop 开始，替换阈值、工具、节奏、负责人或检查，而不削弱反馈循环。 | `把 Overnight Docs Sweep 改写到这个仓库和我们现有检查上。` |
| **Craft** | 每次问你一个问题，了解结果、成功定义、范围、检查和停止点，然后在目录中没有合适匹配时创建有边界的 loop。 | `访谈我，并帮我设计一个把客户反馈转成已验证修复的 loop。` |
| **Run** | 在有限轮次中执行指定 loop，应用验收检查，并返回有证据支撑的回执。 | `在这个仓库运行 Overnight Docs Sweep。` |
| **Debrief** | 分析一个或多个已完成运行回执，并推荐最小且有依据的改进。 | `复盘这个运行回执，告诉我这个 loop 是否需要改变。` |
| **Publish** | 检查质量和目录重叠，准备精确发布预览，并只在明确批准后提交。 | `准备把这个 loop 发布到 Loop Library。` |

例如，在 Claude Code 或 Cursor 中：

```text
/loopy 找一个用于提升测试可靠性的 loop。
```

在 Codex 中，先从 `/skills` 选择 **Loopy**，然后发送：

```text
找一个用于提升测试可靠性的 loop。
```

### 从你的工作中发现 loop

Discovery 会在你放入范围的来源中寻找反复出现的工程工作。在代码库中，这可能包括脚本、
CI 和部署配置、测试、runbook、维护命令，以及重复的生命周期模式。在编码线程中，
它会把语义等价的已完成工作归组，即使措辞不同。

Loopy 至少需要两个不同的线程发生过同类工作，才会称其为重复。没有运行历史的代码模式会被
标记为潜在 loop，而不是已证明的重复工作。随后它会检查新反馈是否能改变下一步动作、成功是否
可以验证、工作是否有清晰边界、停止行为和批准边界。它还会检查实时目录，以避免重新创建已有 loop。

Loopy 只能检查你的 agent 能访问、且你放入范围的仓库和编码线程。如果线程历史不可用，
它会使用代码库证据并说明这一限制。Discovery 结果会包含紧凑来源证据，并返回新 loop、
已发布 loop 的改写版本、在需要你选择时返回短候选列表，或在没有真正合适内容时干净地不操作。

当 Loopy 找到或创建正确的 loop 后，它会给出一个你可以交给 agent 使用的提示词。
你可以复制该提示词，或明确要求 Loopy 在目标项目中运行它。选择一个 loop 不会启动运行、
创建计划、部署代码、删除数据、发布内容、发送消息或授予新权限；这些动作必须由你显式请求。

### 运行和改进 loop

当被要求运行 loop 时，Loopy 会重新读取当前状态，一次执行一个有界动作，在每一轮后应用同一
验收检查，并在成功、干净无操作、阻塞、需要批准、达到限制或没有可测量进展时停止。行动前，
它要求 loop 或你提供一个有限运行边界。回执会保留精确的 loop 定义，或不可变引用加上验收条件，
以便之后的复盘能够复现当时运行的内容。除非你要求，或项目已有明确约定，Loopy 不会创建持久运行文件。

把这个回执交回给 Loopy 即可复盘。它会区分 loop 设计问题和执行、工具、环境或目标问题，并推荐一个
由证据支撑的最小变更。单次运行会被当作一个结果，而不是重复模式。

### 准备发布 loop

Loopy 会验证反馈循环，检查实时目录中是否有重叠，并准备精确候选记录和目的地供你审阅。
没有明确批准，它不会发送建议、保存 owner 草稿或公开发布。已授权的 owner 动作默认保存为草稿，
除非你另行批准公开发布。公开建议只返回接受回执；owner 草稿和公开发布需要读回状态。
建议提交还需要你单独确认预览中显示的当前所有权和许可声明。

每个已发布 loop 还包含几个有用部分：

- **Use when** 说明这个 loop 要解决的问题。
- **Prompt** 是可以直接复制给 agent 的指令。
- **Verify** 定义证明工作成功的证据。
- **Steps** 用更易读的形式展示反馈循环。
- **Notes** 说明实际限制、风险或设置细节。
- **Related loops** 指向可能更合适的相邻工作流。

## 浏览或贡献

访问 [Loop Library](https://signals.forwardfuture.com/loop-library/) 来浏览已发布 loop、
复制到自己的工作流，或提交一个对你有效的 loop。

Loop Library 是 [Forward Future](https://www.forwardfuture.com/) 项目，采用
[MIT License](LICENSE)。

<details>
<summary>维护者说明</summary>

### 发布 loop

公开 loop 存储在连接到 Cloudflare Worker 的目录数据库中。发布已审阅的 loop 不需要
GitHub commit 或静态站点部署。

把 `loop-library/worker/examples/loop.json` 复制到仓库外部，填入记录，然后运行：

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loop:publish -- /path/to/loop.json
```

该命令会验证记录，并从同一次数据库写入发布首页行、详情页、JSON/Markdown/纯文本目录、
feed 和 sitemap。使用 `--draft` 保存非公开记录，或使用 `--archive` 从公开响应中移除记录，
同时保留修订历史。

第一次数据库支撑的发布需要从私有迁移包导入一次。loop 记录和 bootstrap 数据有意不提交到 GitHub：

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:import -- /private/path/bootstrap.json
```

将一个长随机 `LOOP_PUBLISH_TOKEN` 设置为 Worker secret。目录使用 SQLite 支撑的 Durable Object，
并为每次发布保留追加式修订。数据库激活前会强制校验已审阅 bootstrap 摘要。

创建当前数据库的私有备份：

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:export -- /private/path/catalog-backup.ndjson
```

只把该快照恢复到全新的空目录数据库：

```bash
LOOP_PUBLISH_TOKEN=... \
  npm --prefix loop-library/worker run loops:restore -- /private/path/catalog-backup.ndjson
```

Bootstrap 和备份文件必须仅 owner 可读写（`chmod 600`）。导出包含草稿、归档记录和完整修订历史；
请把它们保存在仓库外。

当前 Git 树包含站点 shell 和渲染代码，但没有已发布 loop 记录、生成的 loop 页面、目录、feed、
sitemap 或离线目录 fallback。旧目录和来源归属元数据已经公开，并有意保留在迁移前 Git 历史中；
这次迁移不会重写仓库历史，也不会破坏现有 clone。

### 本地预览

```bash
python3 -m http.server 4173 --directory loop-library/site
```

然后打开 `http://localhost:4173`。

### 验证改动

```bash
npm ci --prefix loop-library/worker
node --check loop-library/site/script.js
node loop-library/scripts/check.mjs
npm --prefix loop-library/worker run check
python3 -m json.tool loop-library/site/.herenow/data.json >/dev/null
python3 -m json.tool loop-library/scripts/seo-geo-query-benchmark.json >/dev/null
git diff --check
```

### 配置投票

投票存储在专用 SQLite Durable Object 中。读取总票数是公开的，但投票、改票或撤票需要 GitHub 登录。
把 `SESSION_SECRET` 和 GitHub OAuth client credentials 设置为 Worker secrets；
`loop-library/worker/.dev.vars.example` 只用于本地变量名参考。注册 `AGENTS.md` 中给出的规范回调，
然后先部署 Worker，再部署站点 shell，因为 shell 会调用新的 auth 和 vote routes。

here.now 代理不会转发浏览器 cookie 或 mutation `Origin` headers，并会跟随上游重定向。因此 OAuth 流程
使用 HMAC 签名、绑定浏览器 nonce 的 state 值，以及 `no-store` callback bridge。该 bridge 会把签名
session token 保存到标签页级 `sessionStorage`；session 查询和投票写入只在同源 JSON 请求体中发送它。

Auth 和 proxy 变更使用 fail-closed 分阶段发布。部署 Worker 和 proxy 时临时设置
`VOTING_UI_ENABLED=false`，然后在规范域名上完成 GitHub 登录、nonce-bound callback、session、vote、
reload 和 logout 冒烟测试。测试通过后，把该值提交为精确字符串 `true`，并只重新部署 Worker；
已发布站点无需再次发布即可显示投票控件。

编辑 loop 或发布站点前请阅读 [AGENTS.md](AGENTS.md)。它包含数据库发布、生成响应、表单安全和
clean-main 部署的权威规则。

</details>
