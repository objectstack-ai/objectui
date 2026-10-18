# objectui#12725 phase 6 + objectui#12894's console wiring: live readings

Branch under test: `claude/issue-12725-copilot-composer-wiring` (commit `a1babb11`), served by the console's Vite dev server on port 5735. This evidence branch is never merged.

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.3`, the showcase app) on port 4735. The console's `/api` proxy points at the driver's forwarding proxy on port 4799, which passes every request to the backend except the three this scenario owns (below). Chromium headless, zh-CN, 1010 x 900 and 1280 x 900, driven by `live-driver.cjs` (Playwright).

## What the driver plays

The community backend serves no AI agent, so the copilot's server side is played by the driver:

- `POST /api/v1/ai/agents/build/chat`, turn 1: `apply_edit` answers `changes_proposed` with the draft posture (objectstack-ai/cloud#2924's envelope: `posture`, `primaryAction: 'save_draft'`, one row per change). Turn 2 (the 存为草稿 click): the confirm replay `replay_t2_0` answers `drafted` with `draftState`, `existingRows` and `appliedCard`.
- `GET /api/v1/meta/_drafts` answers `[]` until the replay, then one row (`object · showcase_task`).
- `POST /api/v1/packages/:id/discard-drafts` answers the spec's `DiscardPackageDraftsResponse` inside the dispatcher envelope and empties the ledger.
- The probe runs (`probe-*`, `fixed-*`) play phase 5's scenario instead (`SCENARIO=drafted`): a non-replay `apply_edit` answers `drafted`, then the agent narrates in English. That thread is the one that showed the slot clip.

Stubbed in the browser, as in phase 5: `GET /api/v1/auth/me/permissions` gains `studio.access`; `GET /api/v1/packages` answers the showcase package (writable); `GET /api/v1/ai/agents` answers one agent named `build` (cloud's `BUILD_AGENT_NAME`; phase 5's driver named it `studio_copilot`, which the console does not resolve as the build agent); `/api/v1/ai/conversations` answers an empty thread.

Leaf: Interfaces, opened by its own deep link `?surface=object:showcase_task` (任务).

## The 1010 px slot clip (Target item 1)

| reading | slot | `ai-chat-panel` | send button right edge | elements past the slot |
| --- | --- | --- | --- | --- |
| before (`probe-1010-build.json`, `before-1010-slot-clip.png`) | 300 | 342 | 1040 (slot ends at 1010) | 43 |
| after, 1010 (`fixed-1010.json`, `after-1010-slot-fits.png`) | 300 | 299 | 997 | 0 |
| after, 1280 (`fixed-1280.json`, `after-1280-slot-fits.png`) | 360 | 359 | 1267 | 0 |

"Before" is the branch's working tree without the one `min-w-0` token on the chat column (the doors were already wired; they do not touch layout). The clip needs a tool card with a one-line summary in the thread: with phase 5's `drafted` card it shows, with the `changes_proposed` card alone it does not.

The culprit, measured (`probe-1010-culprit.json`): lay the chat column out at its min-content width (342 px), then hide one element at a time and keep those whose absence brings it to the slot's width. The deepest is the draft card's summary, `span.min-w-0.flex-1.truncate` (nowrap; its own min-content 296 px), in the card's publish row (`发布 (1)` + summary, 320 px). `min-w-0` and `truncate` on the span only bite when an ancestor bounds the width; the chat column (`[data-chat-column]` in `ChatPane`) is a flex item whose automatic minimum width is its content's min-content, so the summary's whole text widened the column, the chat panel inside it, and everything else in the panel (the share button, the bubbles, the composer). The fix bounds the column (`min-w-0`).

## The applied card's doors (objectui#12894)

`doors-1010.json`, `doors-1280.json`, with `doors-*-1..4.png`:

- after turn 1: the composer's placeholder reads 「问问数据，或让我改改这个应用…」 and the chip 「正在讨论：任务」; the card fits (`panelWidth` 299 / 359, send button whole);
- after 存为草稿: the 变更 badge reads 1, and the applied card shows 「已存为草稿 · 1 项未发布」 with two buttons, 查看变更并发布 and 撤销 (`doors-*-2-applied-card.png`);
- 查看变更并发布: the 变更 drawer opens (「待发布的变更」, the one draft listed); `location.href` and the navigation entry count are the same before and after the click, so the surface did not reload and the pillar and selection stayed (`doors-*-3-drawer-from-review.png`);
- 撤销 (the drawer closed first): one `POST /api/v1/packages/com.example.showcase/discard-drafts`, the card reads 已撤销, the 变更 badge is gone (`doors-*-4-after-undo.png`).

`fullpage-1280.json`, `fullpage-1280-*.png`: the same two turns on the full-page chat (`/ai/build?package=com.example.showcase`); 查看变更并发布 lands on `/studio/com.example.showcase/interfaces` with the drawer open, the `changes` parameter already dropped.

## Seen on the way, not this change

With the real `build` agent the full-page and Studio chats draw the floating pending-drafts bar (「有 1 项改动尚未发布… 发布」) while a draft is pending. In the Studio copilot's slot it sits over the composer's input line, at 1010 and at 1280 (`doors-*-2-applied-card.png`, `after-*-slot-fits.png`). Phase 5's driver named its agent `studio_copilot`, so its shots never drew the bar.
