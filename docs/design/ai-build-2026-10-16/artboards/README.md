# AI 搭建 · 设计稿（2026-10-16，维护者裁定「同意」）

Three artboards from the design canvas (private, the maintainer's), exported as source for the lanes. `*.dc.html` is the canvas source (`{{accent}}` is the primary-colour token); `*.preview.html` is the same page with the token substituted and the canvas wrapper removed, so it opens in a browser as plain HTML (fonts from Google Fonts).

| Board | What it fixes |
| --- | --- |
| `AiBuild` (1280 × 1040) | the build conversation: plan card v2 (field chips with format constraints, 「名称：自动生成」 on relation objects, lifecycle marks on status options, one intent line per view with layout / group / filter / sort, assumptions, 开始搭建 / 调整方案), the collapsed progress line, the result card v2 (verified 7/7 with numbers, 打开应用 / 在 Studio 中查看 in the chat, no redirect), the composer placeholder |
| `StudioCopilot` (1280 × 820) | the Studio copilot as a 360 px side panel: change card v2 (one row per change with machine names), the draft posture note for a live app with data, 存为草稿 / 调整, the applied card with 查看变更并发布 / 撤销, the top bar's 变更 badge in sync |
| `StudioCopilotDock` (1010 × 700) | below 1280 px: the copilot as a 340 px overlay dock over a full-width canvas, pinnable, the navigation rail folded to icons |

Rulings (2026-10-16, in the epic PM session, verbatim 「同意」 to the four points as drawn): first build publishes at once, later changes to a live app with data are saved as a draft; the plan card shows the full detail; overdue = status 逾期 and 归还日期 empty; sample data defaults to 12 rows per object with uniqueness and format checks.
