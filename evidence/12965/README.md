# objectui#12965: the pending-drafts bar over the Studio copilot's composer, live readings

This evidence branch is never merged. It sits on the fix commit `ac7edbc6` of `claude/issue-12965-studio-drafts-bar`.

## Rig

- Console: the Vite dev server of the worktree, on port 5965, serving the source as it stood for each reading. "Before" is `main` at `43efd078` (the worktree before the edit). "After" is the edit, the same tree as `ac7edbc6`.
- Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.3`, the showcase app) on port 4965. The console's `/api` proxy points at the driver's forwarding proxy on port 4966. That proxy passes every request to the backend except the chat stream and `GET /api/v1/meta/_drafts`, which the driver answers.
- Browser: Chromium headless, zh-CN, 1010 x 900 and 1280 x 900, driven by `live-driver.cjs` (Playwright). The driver is objectui#12725 phase 6's (`claude/issue-12725f-evidence`, `evidence/12725f/live-driver.cjs`) with the same scenario, stubs and agent name. Only the reading is new.

## What the driver plays

The community backend serves no AI agent, so the driver plays the copilot's server side, as phase 6 did:

- `GET /api/v1/ai/agents` answers one agent named `build` (cloud's `BUILD_AGENT_NAME`), so `ChatPane`'s `isBuildSurface` is true. Phase 5's driver named its agent `studio_copilot`, which never drew the bar.
- Turn 1: `apply_edit` answers `changes_proposed`. The 存为草稿 click sends turn 2, and the confirm replay answers `drafted`. From then on `_drafts` lists one draft (`object · showcase_task`).
- In the browser: `studio.access` added to the permissions, the showcase package listed as writable, an empty conversation list.

Studio opens on Interfaces with `?surface=object:showcase_task` (任务). The full page opens `/ai/build?package=com.example.showcase`.

## The reading (`composerReading` in the driver)

Taken after 存为草稿, once the bar has had time to re-read the ledger. It records the composer textarea's box, the bar's box (`[data-testid="pending-drafts-bar"]`) and their overlap. It also records what `document.elementFromPoint` finds at five points along the textarea's first text line, the line the placeholder is drawn on. The bar's wrapper is `pointer-events-none` and the bar is `pointer-events-auto`, so a point the bar covers reports the bar. `placeholderWidth` is the placeholder measured in the textarea's own font. `composerContentWidth` is the textarea's width inside its padding.

| reading | 变更 badge | bar | textarea (left, top, right, bottom) | overlap (x by y) | first-line points on the composer | placeholder / content width |
| --- | --- | --- | --- | --- | --- | --- |
| `before-studio-1010` | 1 | shown, 727 766 994 820 | 712 769 1009 833 | 267 by 51 | 0 of 5 (all `pending-drafts-bar`) | 208 / 273 |
| `before-studio-1280` | 1 | shown, 937 766 1264 820 | 922 769 1279 833 | 327 by 51 | 0 of 5 (all `pending-drafts-bar`) | 208 / 333 |
| `after-studio-1010` | 1 | not drawn | 712 769 1009 833 | none | 5 of 5 | 208 / 273 |
| `after-studio-1280` | 1 | not drawn | 922 769 1279 833 | none | 5 of 5 | 208 / 333 |
| `before-fullpage-1280` (control) | n/a | shown, 401 766 1169 820 | 450 769 1120 833 | 670 by 51 | 0 of 5 (all `pending-drafts-bar`) | 208 / 646 |
| `after-fullpage-1280` (control) | n/a | shown, 401 766 1169 820 | 450 769 1120 833 | 670 by 51 | 0 of 5 (all `pending-drafts-bar`) | 208 / 646 |

Before the draft (`beforeDraft` in each JSON), every reading has all five points on the composer.

- **Before, in Studio:** the bar covers the composer's first line at both widths. The shots `before-studio-*-draft-pending.png` show 「有 1 项改动尚未发布… 发布」 over the input, and the placeholder cannot be seen.
- **After, in Studio:** no bar is drawn. All five points reach the composer, and the placeholder 「问问数据，或让我改改这个应用…」 (208 px) fits its 273 / 333 px content width, so it shows whole (`after-studio-*-draft-pending.png`). The 变更 badge still reads 1 at both widths, the item header reads 「草稿 · 1 项未发布」 at 1280 (at 1010 it shows the chip without its text), and the applied card keeps 查看变更并发布 and 撤销.
- **The full-page control:** the same reading before and after (every box, the overlap and the five points). The bar is drawn there, as the card requires.

## Seen on the way, not this change

On the full-page chat at 1280 px the bar also sits over the composer's first line: overlap 670 by 51, all five points on the bar (`before-fullpage-1280-draft-pending.png`). The card keeps the bar outside Studio as it is, so this is reported on the card, not changed here. The console dock was not measured.
