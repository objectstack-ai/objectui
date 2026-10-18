# objectui#12725 phase 5: the 变更 badge and the item header follow a copilot `drafted` result as it lands (live reading)

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.3`, showcase at objectstack `2c9bf9430a11`), on port 4725.
Console: `before` = objectui `32b492b6` (`origin/main` when the branch was cut), vite on port 5726; `after` = branch `claude/issue-12725-draft-badge-marks` at `111d6816`, vite on port 5725. Both proxy `/api` to the driver's forwarding proxy on port 4798, which passes every request to the backend except the two this scenario owns (below). Chromium headless, zh-CN, 1280 x 900 and 1010 x 900, driven by `live-driver.cjs` (Playwright).

## What the driver plays

The community backend serves no AI agent, so the copilot's server side is played by the driver:

- `POST /api/v1/ai/agents/studio_copilot/chat` answers an AI SDK UI message stream: a line of text, then the tool `apply_edit` answers `drafted` with the envelope shape of objectstack-ai/cloud#2924 (cloud `f9e45145`: `status: 'drafted'`, `kind: 'edit'`, `drafted[]`, `packageId`, `posture`, `draftState`). The agent then keeps narrating for 20 s before the turn ends.
- `GET /api/v1/meta/_drafts` answers `[]` until the tool answers, and the two drafted rows (`object · showcase_task`, `view · showcase_task.all_tasks`) from then on: the draft exists server-side before the tool result is sent, as in the producer.

Stubbed in the browser, identically for before and after: `GET /api/v1/auth/me/permissions` gains `studio.access` (the published backend grants it to no principal); `GET /api/v1/packages` answers the showcase package; `GET /api/v1/ai/agents` answers one agent; `/api/v1/ai/conversations` answers an empty thread.

Leaf: Interfaces › 数据模型 › 任务 (`object · showcase_task`). Shots per run: `1-before` (empty ledger), `2-landed-turn-running` (2.5 s after the tool answered; the agent is still narrating, the composer shows the stop button), `3-turn-ended`.

## Readings (DOM, per run; the `*.json` files hold each run's whole output)

| run | before | 2.5 s after the tool answered, turn still running | turn ended | first `_drafts` read after the tool answered |
| --- | --- | --- | --- | --- |
| before 1280 | no badge, no header line | **no badge**, no header line | badge 2, no header line | +20.1 s, i.e. 129 ms after the turn ended |
| before 1010 | no badge, no header line | **no badge**, no header line | badge 2, no header line | +20.1 s, 90 ms after the turn ended |
| after 1280 | no badge, no header line | **badge 2, 「草稿 · 2 项未发布」** | badge 2, line | +0.63 s, while the agent was still narrating |
| after 1010 | no badge, no header line | **badge 2, 「草稿 · 2 项未发布」** (the chip folds to its pencil at this width, objectui#12611; the text is its tooltip) | badge 2, line | +0.65 s |

No reload and no navigation in any run: the page's navigation entry and URL are the same before the send and after the turn (`sameDocument: true`).

The `before` header never shows a draft mark for the copilot's change, even after the turn: the pillar reads the open item once at load, and an `object` leaf carries no status chip of its own.

## Seen on the way, not this change

At 1010 px, once the thread holds a message, the chat panel inside the 300 px copilot slot is 342 px wide (`ai-chat-panel`), so its right 42 px are clipped: the share button, the end of the user's bubble and the send button (`*-1010-2-*.png`, `*-1010-3-*.png`, before and after alike; `slotOverflow` in `after-1010.json`). With an empty thread it fits (`probe-before-1010.png`, `probe-width.cjs`).
