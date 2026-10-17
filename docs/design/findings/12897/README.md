# objectui#12897: an Interfaces view leaf's item header at 1010 px (live reading)

This branch is evidence only and is never merged.

Backend: `e2e/live/ci/start-backend.sh` with published `@objectstack/*@18.0.0-next.3` and the showcase at objectstack `2c9bf9430a11` (resolved from the release tag), on port 4012. The package is `com.example.showcase`, read-only, so the header carries the read-only link.

Console: the Vite dev server (`apps/console`, `DEV_PROXY_TARGET=http://localhost:4012`, port 5193). Both runs used the same worktree:

- `before` = objectui `main` `c83e3fe`.
- `after` = branch `claude/issue-12897-item-header-title`. Its `StudioItemHeader.tsx` was blob `3475e82`, the blob that branch carries at `92f50f3`. The later commits on that branch touch only tests and the changeset.

Chromium (headless), light theme, `zh-CN`, 1010 × 900 and 1280 × 900. The right slot was open on the copilot: 300 px at 1010 and 360 px at 1280. Everything was driven by `live-driver.cjs` (Playwright).

These are stubbed in the browser, identically for before and after, and nothing else is. They are the objectui#12725d recipe, unchanged:

- `GET /api/v1/auth/me/permissions`: `studio.access` is appended to `systemPermissions` (the Studio gate).
- `GET /api/v1/packages`: one package, `com.example.showcase`, `writable: false`.
- `GET /api/v1/ai/agents`: one agent, so the right slot opens on the copilot.
- `GET /api/v1/meta/app/showcase_app` and `.../layers`: one navigation entry is added after Tasks in the Data Model group: `{ type: 'object', objectName: 'showcase_task', viewName: 'board', label: '任务看板（看板视图）' }`. The showcase declares the kanban view `board` on `showcase_task`, but none of its `object` nav entries lands on a kanban view.

Leaf: 界面 › 数据模型 › 任务看板（看板视图）. Each run's DOM readings of the header's title row are in `WIDTH.json`. That file has every piece's width, the title's text width (`scrollWidth`) and its `title` attribute, and each action's width and fold state.

| run | row | title (box / text) | actions slot | read-only link | title tooltip |
|---|---|---|---|---|---|
| before 1010 | 422 px | **0 px** / 178 px | 316.9 px | 132.3 px, whole | 内部标识: object · showcase_task |
| after 1010 | 422 px | **103.8 px** / 178 px, cut with an ellipsis | 212.6 px | 28 px, folded to its glyph | 任务看板（看板视图） · 视图, then 内部标识: object · showcase_task on the next line |
| before 1280 | 632 px | 178.2 px / 178 px, whole | 316.9 px | 132.3 px, whole | 内部标识: object · showcase_task |
| after 1280 | 632 px | 178.2 px / 178 px, whole | 316.9 px | 132.3 px, whole | 内部标识: object · showcase_task |

Where the width went before: the row is 422 px. The icon takes 32 px, the 视图 kind chip 37.7 px, the actions slot 316.9 px (`ml-auto flex shrink-0`: 只读 · 用覆盖定制 at 132.3, 在「数据」中打开 at 136.6, ⋯ at 32, and two 8 px gaps), and the three 12 px gaps 36 px. That sums to the whole row. The title (`min-w-0`, `flex-shrink: 1`) was the only piece allowed to shrink, so it went to 0. Nothing in the row overflowed: the row's `scrollWidth` was 423.

At 1010 px after the fix, all three actions are in the row (`visible: true` in `after-1010.json`), and the row holds exactly its 422 px.
