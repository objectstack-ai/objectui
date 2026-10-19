# objectui#13088: the pending-drafts bar's sentence on a phone, browser readings

This directory lives on ONE commit of `claude/issue-13088-drafts-bar-sentence-wraps` and is deleted by the next commit, so the pull request's diff never carries it. It stays reachable through that commit's SHA (the pull request keeps its commits).

## Rig

The rig of objectui#12978 (PR #13067) and objectui#13068 (PR #13085), reused:

- Console: the worktree's own Vite dev server (`apps/console`, port 5988), serving the source as it stood for each reading. "Before" is objectui `main` `cd4623d` (the branch point, nothing edited). "After" is the fix, commit `d45156b`.
- Page: `ev13088-harness.html` + `ev13088-harness.tsx` (copied here; never part of the tree). They mount the REAL full-page `AiChatPage` (route `/ai/build/conv_ev?package=com.example.showcase`), or (`mode=dock`) the REAL `ChatDockPanel` beside an app page, or (`mode=sheet`) the REAL `ChatDockMobileSheet`, with the console's real `index.css`. The one addition to the objectui#13068 harness is `lang=zh|en`, which sets the `I18nProvider` language.
- No backend: `window.fetch` is stubbed in the page. One `build` agent; a conversation of two turns plus an `apply_blueprint` result that drafted an app; the drafts ledger answers one draft.
- Browser: Chromium headless (`/opt/pw-browsers/chromium`), locale zh-CN or en-US, driven by `driver.cjs` (Playwright 1.62.1). Readings with `-pill` first tap the app card's Preview, close the preview, and read with the pill showing above the bar. The driver reads the sentence span's `scrollWidth` / `clientWidth`, its line count (distinct line tops of a `Range` over its text), its computed `white-space` / `text-overflow`, and the boxes of the sentence, the bar, the button, the textarea and the pill, the bar's intersection area with the textarea, whether the button sits inside the bar and on screen, and whether a tap at the button's centre reaches it.

## Control: the harness reproduces the card's reading

The card measured the zh sentence at `scrollWidth` 248 against `clientWidth` 240 at 390 px (248 against 170 at 320 px), and the bar at `16 650 374 704`. `before-fullpage-390-zh` and `before-fullpage-320-zh` read the same.

## Readings

Each reading is one JSON file here, named by its label; the bar crops and full-page screenshots carry the same labels. The table of boxes is on the pull request.
