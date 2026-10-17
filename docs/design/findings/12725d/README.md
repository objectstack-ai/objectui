# objectui#12725 phase 4: a card on a kanban view leaf's Studio canvas selects the board's card (live reading)

Backend: `e2e/live/ci/start-backend.sh` from the feature branch's merged head (`9591cd2`): published `@objectstack/*@18.0.0-next.3`, showcase at objectstack `2c9bf9430a11`, port 4110. Package `com.example.showcase` (read-only, so the panel is read-only and nothing is saved).
Console: `before` = objectui `main` `26323c4` (port 5291), `after` = branch `claude/issue-12725-kanban-card-panel` at `9591cd2` (port 5290). Chromium headless, light, `zh-CN`, 1280 x 900 and 1010 x 900, driven by `live-driver.cjs` (Playwright).

Stubbed in the browser, identically for before and after, and only these:
- `GET /api/v1/auth/me/permissions`: `studio.access` is appended to `systemPermissions` (the Studio gate; phase 3's recipe). Whether next.3 still needs it was not measured.
- `GET /api/v1/packages`: one package, `com.example.showcase`, `writable: false` (phase 3's recipe).
- `GET /api/v1/ai/agents`: one agent, so the right slot opens on the copilot.
- `GET /api/v1/meta/app/showcase_app` (the draft read) and `.../layers`: ONE navigation entry is added after Tasks in the Data Model group, `{ type: 'object', objectName: 'showcase_task', viewName: 'board', label: '任务看板（看板视图）' }`. The showcase declares the kanban list view `board` on `showcase_task` (`task.view.ts`), but no `object` nav entry of the showcase lands on a kanban view, so without this entry there is no kanban view leaf to click. Its board is a `page` leaf (phase 3's reading).

Leaf: 界面 › 数据模型 › 任务看板（看板视图） (`object · showcase_task`, view `board`: `type: 'kanban'`, `kanban.groupByField: 'status'`). Per run: `open`, `card-click` (a click on the first card, "Content backlog"), `esc`, `empty-click` (the second card clicked, then a click on the canvas gutter). Each run's DOM readings are in `RUN-WIDTH.json`.

| run | open | card click | Esc | empty canvas click |
|---|---|---|---|---|
| before 1280 / 1010 | copilot (360 / 300 px), hint 「点元素 → 右栏切到属性」, no 看板卡片 section, cards carry no `data-kanban-card` | the record-detail overlay opens (「Showcase task详情」), the slot stays on the copilot, nothing selected | the overlay closes | the second card opens the overlay again; nothing selected |
| after 1280 / 1010 | copilot, same hint; the panel holds the 看板卡片 section; all 10 cards carry `data-kanban-card` | slot 属性 with the 看板卡片 section marked selected, the card outlined, 「已选中：看板卡片 · Esc 取消选中」, no overlay, the URL unchanged | slot stays 属性, section and outline cleared, hint gone | cleared, slot stays 属性 |

On `main` the canvas already says 「点元素 → 右栏切到属性」 on this leaf, because the view lists columns; no card click answers it there.

Recorded, not part of this change: at 1010 px the item header's title is drawn with no visible text beside its chips, on `main` and on the branch alike (`before-1010-open.png`, `after-1010-card-click.png`).

## Keyboard (after objectui#12888)

`main` `1d872f2` (objectui#12888) made a focused card open on Enter and Space and split `SortableCard` into a list item wrapping a `role="button"` control; the branch now carries `data-kanban-card` on that control. Re-read on the branch head `9bce2a9` (merged with `main` `1d872f2`), same backend (`18.0.0-next.3`) and stubs, `MODE=enter`: the driver focuses the first card's control and presses Enter (`after-WIDTH-card-enter.png`, `after-WIDTH-enter.json`; the other shots of that run were not kept).

| width | Enter on a focused card | Esc |
|---|---|---|
| 1280 / 1010 | slot 属性, 看板卡片 selected, the card outlined, 「已选中：看板卡片 · Esc 取消选中」, no overlay, URL unchanged | slot stays 属性, cleared |

While the card keeps keyboard focus, the browser's focus ring on the control draws over the selection outline. The JSON's `cardKeyed` reads 0 here because it counts the outer list items, and the attribute now sits on the control inside each.
