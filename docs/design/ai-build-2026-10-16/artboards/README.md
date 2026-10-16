# AI 搭建 · 设计稿（2026-10-16，维护者裁定「同意」）

Three artboards from the design canvas (private, the maintainer's), exported as source for the lanes. `*.dc.html` is the canvas source (`{{accent}}` is the primary-colour token); `*.preview.html` is the same page with the token substituted and the canvas wrapper removed, so it opens in a browser as plain HTML (fonts from Google Fonts).

| Board | What it fixes |
| --- | --- |
| `AiBuild` (1280 × 1040) | the build conversation: plan card v2 (field chips with format constraints, 「名称：自动生成」 on relation objects, lifecycle marks on status options, one intent line per view with layout / group / filter / sort, assumptions, 开始搭建 / 调整方案), the collapsed progress line, the result card v2 (verified 7/7 with numbers, 打开应用 / 在 Studio 中查看 in the chat, no redirect), the composer placeholder |
| `StudioCopilot` (1280 × 820) | the Studio copilot as a floating panel (380 × 560) docked bottom-right over the canvas, never over the properties rail; the properties rail (300 px) stays and follows the selection (a kanban card is selected: its card fields, grouping, title), with the copilot's draft changes marked 草稿; change card v2 (one row per change with machine names), the draft posture note for a live app with data, 存为草稿 / 调整, the applied card with 查看变更并发布 / 撤销; the minimised pill「AI 副驾 · 2 项待确认」; the pillar switcher keeps its labels 数据 / 自动化 / 界面 / 权限 |
| `StudioCopilotDock` (1010 × 700) | the same floating panel at 1010 px (340 wide), the properties rail kept at 260 px and showing the selected draft field's properties, the navigation rail folded to icons |

Rulings (2026-10-16, in the epic PM session; 「同意」 to the four points as drawn, then 「studio 中其他的设计面板属性都是右侧打开的，你换到 tab 会不会改动太大，是否考虑浮出」and「属性好需要考虑选中每个元素的时候也要显示。」which turned the copilot into a floating panel with the properties rail kept, and「按浮窗版定稿」): first build publishes at once, later changes to a live app with data are saved as a draft; the plan card shows the full detail; overdue = status 逾期 and 归还日期 empty; sample data defaults to 12 rows per object with uniqueness and format checks.
