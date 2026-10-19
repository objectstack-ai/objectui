# objectui#12978: the pending-drafts bar against the composer, browser readings

This directory lives on ONE commit of `claude/issue-12978-drafts-bar-composer` and is deleted by the next commit, so the pull request's diff never carries it. It is reachable through that commit's SHA (the pull request keeps its commits).

## Rig

- Console: the worktree's own Vite dev server (`apps/console`, port 5978), serving the source as it stood for each reading. "Before" is objectui `main` at `50ba1bb` for the two files this change edits (`AiChatPage.tsx`, `ChatbotEnhanced.tsx`), checked out over the fix and restored afterwards (restore proved by blob hash against HEAD and an empty `git diff HEAD`). "After" is the fix commit `8d6c70a`.
- Page: `harness.html` + `harness.tsx` (copied here; they were never part of the tree). They mount the REAL full-page `AiChatPage` (route `/ai/build/conv_ev?package=com.example.showcase`) and the REAL `ChatDockPanel` with its real default body, inside a stand-in console frame (a 56 px header and a main area to the dock's left), with the console's real `index.css`.
- No backend: `window.fetch` is stubbed in the page. The agent catalog answers one agent named `build`; the conversation answers two turns; the drafts ledger (`GET /api/v1/meta/_drafts`) answers one draft for the bound package (`drafts=0` answers none). The dock resolves the `build` agent through its own `resolveSurfaceAgent` (the catalog has no `ask`), so it hosts the build agent here without any override.
- Browser: Chromium headless (`/opt/pw-browsers/chromium`), locale zh-CN, driven by `driver.cjs` (Playwright 1.62.1). Same reading as objectui#12965's driver: the textarea's box, the bar's box (`[data-testid="pending-drafts-bar"]`), their intersection, and `document.elementFromPoint` at five points along the textarea's first text line.

## Control: the harness reproduces the card's live reading

The card measured the full page at 1280 x 900 against a real backend: bar `401 766 1169 820`, textarea `450 769 1120 833`, overlap 670 by 51, 0 of 5 first-line points on the composer, placeholder 208 / 646. `before-fullpage-1280` below reads the same numbers, box for box.

## Readings (left top right bottom, CSS px)

| reading | bar | textarea | intersection | first-line points on the composer | placeholder / content width |
| --- | --- | --- | --- | --- | --- |
| `before-fullpage-1280` | 401 766 1169 820 | 450 769 1120 833 | 670 by 51, area 34170 | 0 of 5 | 208 / 646 |
| `after-fullpage-1280` | 449 706 1121 760 | 450 769 1120 833 | 670 by 0, area 0 | 5 of 5 | 208 / 646 |
| `before-fullpage-1010` | 305 766 994 820 | 315 769 985 833 | 670 by 51, area 34170 | 0 of 5 | 208 / 646 |
| `after-fullpage-1010` | 314 706 986 760 | 315 769 985 833 | 670 by 0, area 0 | 5 of 5 | 208 / 646 |
| `before-dock-1280` | 877 766 1264 820 | 862 769 1279 833 | 387 by 51, area 19737 | 0 of 5 | 208 / 393 |
| `after-dock-1280` | 861 706 1280 760 | 862 769 1279 833 | 417 by 0, area 0 | 5 of 5 | 208 / 393 |
| `before-dock-1010` | 607 766 994 820 | 592 769 1009 833 | 387 by 51, area 19737 | 0 of 5 | 208 / 393 |
| `after-dock-1010` | 591 706 1010 760 | 592 769 1009 833 | 417 by 0, area 0 | 5 of 5 | 208 / 393 |
| `before-fullpage-390` | 16 710 374 764 | 17 713 373 777 | 356 by 51, area 18156 | 0 of 5 | 238 / 332 |
| `after-fullpage-390` | 16 650 374 704 | 17 713 373 777 | 356 by 0, area 0 | 5 of 5 | 238 / 332 |
| `after-fullpage-768` | 289 706 768 760 | 290 769 767 833 | 477 by 0, area 0 | 5 of 5 | 208 / 453 |

- **Before:** the bar's box covers the textarea's first 51 px at every width read, on the full page and in the console dock. Every first-line point reports the bar.
- **After:** the bar sits in the composer's area, 9 px above the textarea (bar bottom 760, textarea top 769 at 900 px high), its width the composer's. The intersection's area is 0, all five first-line points reach the textarea, and the placeholder fits whole. The textarea's own box does not move: the conversation gives up the room (its bottom moves from 768 to 706, 54 px of bar and 8 px of gap).
- **No draft:** `before-fullpage-1280-nodraft` and `after-fullpage-1280-nodraft` read the same textarea box and the same conversation box (bottom 768): the empty slot takes no space.

## The two hypotheses measured on the way

- **`promptOverlaySlot` (H4).** `h4-overlay-fullpage-1280-long` hands the bar to the existing absolute slot instead (a one-off edit, restored). It clears the textarea, but its box covers the bottom 54 px of the conversation's viewport (bar against the `role="log"` box: 648 by 54), where the last message's tail, its action row and the scroll-to-bottom row live. The in-flow row reads 0 there.
- **The phone preview pill (H5).** `before-fullpage-390-pill` and `after-fullpage-390-pill` (390 x 844, a built app, the preview opened and closed so the pill shows). The pill (`ai-chat-mobile-preview-open`, `144 712 246 748`) covers the textarea by 101 by 35 in BOTH readings, and the middle first-line point hits it. Before, it also sat on the bar (101 by 36); after, it does not touch the bar (0). Not changed here.
