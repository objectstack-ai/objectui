# objectui#12725 phase 3: a column header on an object leaf's canvas selects that column (live reading)

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase at objectstack `e5136ff10f1a`, npm 10.9.4, no change needed). Package `com.example.showcase` (read-only, so the panel is read-only).
Console: `before` = objectui `8d6e435` (port 5191), `after` = branch `claude/issue-12725-leaf-column-selection` (port 5190). Chromium headless, 1010 x 900 and 1280 x 900, driven by `live-driver.cjs` (Playwright).

Stubbed in the browser, identically for before and after, and only these:
- `GET /api/v1/auth/me/permissions`: `studio.access` is appended to `systemPermissions`. The published backend answers `systemPermissions: []` for the seeded admin, and the console's Studio gate (`holdsStudioAccess`) then shows "You need Studio access to open Studio."
- `GET /api/v1/packages`: one package, `com.example.showcase`, `writable: false`. The server refuses the list without `studio.access` (PERMISSION_DENIED).
- `copilot` runs: `GET /api/v1/ai/agents` answers one agent (the community build serves none). `nocopilot` runs do not stub it.

Leaf: Interfaces › Data Model › Tasks (`object · showcase_task`, its default list view "All Tasks", 7 columns). Per run: `open`, `header-click` (a click on the Status header), `esc`, `empty-click` (Status clicked again, then a click on the canvas gutter).

Measured from the DOM (slot = `studio-right-slot`; rows = the first two Title cells, to see a sort):

| run | open | Status header click | Esc | empty canvas click |
|---|---|---|---|---|
| before copilot 1010 | copilot, 300 px | slot stays copilot; rows re-sorted (Evidence collection, Content backlog) | nothing to clear | rows sorted again |
| after copilot 1010 | copilot, hint 「Click an element → …」 | props, the Status row pressed in Columns, header outlined, 「Selected: Status · Esc to deselect」, rows unchanged | props, no row pressed, no outline | props, no row pressed, no outline |
| before copilot 1280 | copilot, 360 px | slot stays copilot; rows re-sorted | nothing to clear | rows sorted again |
| after copilot 1280 | copilot, hint shown | props, Status selected and outlined, rows unchanged, strip at the slot's foot | props, cleared | props, cleared |
| before nocopilot 1280 | props, 360 px | rows re-sorted, nothing selected | — | rows sorted again |
| after nocopilot 1280 | props | Status selected and outlined, rows unchanged | cleared | cleared |

Header keys read off the real grid (`thead th[data-column-key]`): `-` (the selection checkbox column, no key), `title`, `project`, `assignee`, `status`, `priority`, `due_date`, `progress`. `before` headers carry no key.

Kanban (measure only; nothing built): the showcase has no `object` nav leaf that opens a kanban view. Its board is a `page` leaf, Authoring · Visualizations › Task Board (`page · showcase_task_board`, `type: list`, `interfaceConfig.appearance.allowedVisualizations: ['kanban']`). A click on the card "Evidence collection" in the Studio canvas, before and after alike: the runtime record-detail overlay opens (the URL gains `recordId=…`), the slot stays on the copilot, and nothing is selected (`*-copilot-1280-board-*.png`).
