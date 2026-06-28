# Prepare or Publish a Loop

当用户要求 Loopy 将 loop 分享、提交或发布到 Loop Library 时，使用这个工作流。准备内容不同于执行外部提交。

## 准备候选项

1. 解析精确 loop 及其作者或贡献者归属。不要编造所有权、日期、来源链接、结果或声明。
2. 运行 `SKILL.md` 中的 crafted-loop 预检。要求真实反馈循环、可复现验证、有界动作、明确停止点，以及必要时的批准边界。
3. 按结果、触发条件、验证、keywords 和相关工作流 搜索实时目录。当强匹配已存在时，优先贡献改写或改进。
   如果目录不可用，在提交前停止，因为无法检查重复。
4. 准备当前官方提交入口需要的字段；如果在 Loop Library 仓库中工作，则准备当前 schema 和示例记录需要的字段。
   可用时用仓库工具验证。保持公开提示词紧凑；把可选的长篇指导放入受支持的 secondary fields，而不是让提示词膨胀。
5. 展示精确提议记录、目的地、归属和请求状态。清楚区分 public suggestion、owner-only draft 和 public publication。
   对于 public suggestion，还要展示官方入口要求的精确当前所有权和许可声明。

## 要求批准并读回

- 没有对预览的明确批准，不要发送 suggestion、保存 owner draft 或公开发布。
- 绝不要从泛泛的提交批准中设置 public suggestion 的 permission 或 attestation 字段。要求用户明确确认预览中展示的精确当前所有权和许可条款。
- 只使用范围内已经可用的官方提交或已认证 owner 工具。绝不暴露 owner credentials 或绕过验证。
- 已授权的 owner 动作默认保存为 draft，除非用户明确批准 public publication。批准保存草稿不等于批准发布它。
- 对于 public suggestion，把官方入口的成功接受响应视为回执。不要编造 identifier，也不要声称 owner-only suggestion 已保存、审阅、起草或发布。
- 对于 owner draft，读回其 identifier 和 draft 状态。对于 public publication，在报告成功前验证实时详情页和目录条目。
  把验证、授权或必要读回失败报告为 blocked。

## 返回预览或回执

批准前返回：

```markdown
## Loopy publication preview

Destination: [official surface]
State: Suggestion | Draft | Public
Duplicate check: Clear | Possible overlap | Blocked
Attestation: [exact current ownership/license terms, or Not applicable]
Candidate: [exact record or concise field-by-field preview]
```

批准 public suggestion 后，返回接受响应，并只说明 suggestion 已收到。owner action 后，返回产生的 identifier、state
和必要读回证据。不要把 prepared preview 或 accepted suggestion 称为 “published”。
