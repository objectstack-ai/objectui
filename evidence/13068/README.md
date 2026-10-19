# objectui#13068: the phone preview pill against the composer, browser readings

This directory lives on ONE commit of `claude/issue-13068-preview-pill-in-flow` and is deleted by the next commit, so the pull request's diff never carries it. It stays reachable through that commit's SHA (the pull request keeps its commits).

## Rig

The rig of objectui#12978 (PR #13067), reused:

- Console: the worktree's own Vite dev server (`apps/console`, port 5968), serving the source as it stood for each reading. "Before" is `AiChatPage.tsx` as of objectui `main` `bc98626`, written over the fix and restored afterwards (restore proved by blob hash against HEAD and an empty `git diff HEAD`). "After" is the fix, HEAD `9c698ba`.
- Page: `harness.html` + `harness.tsx` (copied here; never part of the tree). They mount the REAL full-page `AiChatPage` (route `/ai/build/conv_ev?package=com.example.showcase`), or (`mode=sheet`) the REAL `ChatDockMobileSheet`, the dock's phone presentation, with its real default body, with the console's real `index.css`. The sheet mode is the one addition to the objectui#12978 harness.
- No backend: `window.fetch` is stubbed in the page. One `build` agent; a conversation of two turns plus an `apply_blueprint` result that drafted an app (`app=1`); the drafts ledger answers one draft (`drafts=1`) or none (`drafts=0`).
- Browser: Chromium headless (`/opt/pw-browsers/chromium`), locale zh-CN, driven by `driver.cjs` (Playwright 1.62.1). The driver taps the app card's 预览, waits for the full-screen preview, closes it, and reads: the textarea's box, the pill's box (`ai-chat-mobile-preview-open`), the bar's box (`pending-drafts-bar`), their intersections, `document.elementFromPoint` at five points along the textarea's first text line, the placeholder's width against the composer's content width, and then taps the pill and reads whether the full-screen preview opened.

## Control: the harness reproduces the card's reading

The card measured the pill at `144 712 246 748` and the textarea at `17 713 373 777` (390 x 844), an overlap of 101 by 35. `before-fullpage-390-pill` reads the same boxes.

## Readings (left top right bottom, CSS px)

| reading | pill | bar | textarea | pill on textarea | pill on bar | first-line points on the input | placeholder / content width |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `before-fullpage-390-pill` | 144 712 246 748 | 16 650 374 704 | 17 713 373 777 | 101 by 35 | 0 | 4 of 5 | 238 / 332 |
| `after-fullpage-390-pill` | 144 606 246 642 | 16 650 374 704 | 17 713 373 777 | 0 | 0 | 5 of 5 | 238 / 332 |
| `before-fullpage-390-pill-nodraft` | 144 712 246 748 | none | 17 713 373 777 | 101 by 35 | none | 4 of 5 | 238 / 332 |
| `after-fullpage-390-pill-nodraft` | 144 668 246 704 | none | 17 713 373 777 | 0 | none | 5 of 5 | 238 / 332 |
| `before-sheet-390-pill` | 144 712 246 748 | 16 650 374 704 | 17 713 373 777 | 101 by 35 | 0 | 4 of 5 | 238 / 332 |
| `after-sheet-390-pill` | 144 606 246 642 | 16 650 374 704 | 17 713 373 777 | 0 | 0 | 5 of 5 | 238 / 332 |
| `after-fullpage-320-pill` (320 x 700) | 109 462 211 498 | 16 506 304 560 | 17 569 303 633 | 0 | 0 | 5 of 5 | 238 / 262 |
| `after-fullpage-390-nopreview` | none | 16 650 374 704 | 17 713 373 777 | none | none | 5 of 5 | 238 / 332 |
| `after-fullpage-1280-preview` (1280 x 900) | none | 449 706 1121 760 | 450 769 1120 833 | none | none | 5 of 5 | 208 / 646 |

- **Before:** the pill sits on the textarea's first line (101 by 35), in the full page and in the dock sheet, with or without the bar; the middle first-line point reports the pill.
- **After:** the pill is a row above the bar (8 px gap, 642 to 650), or directly above the input when nothing is pending (9 px gap, 704 to 713). It touches neither the input nor the bar, every first-line point reaches the input, and the placeholder fits whole. The textarea's own box does not move: the conversation gives up the room (its bottom moves from 650 to 606 with the bar, and from 712 to 668 without it). Tapping the pill opens the full-screen preview in every reading that has one.
- **No preview, and desktop:** `after-fullpage-390-nopreview` reads the bar and the textarea exactly as objectui#12978's `after-fullpage-390` did, and `after-fullpage-1280-preview` (a preview opened beside the chat, then closed) reads them exactly as its `after-fullpage-1280` did. No pill is drawn at 1280.
