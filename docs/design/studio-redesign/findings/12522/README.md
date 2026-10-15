# objectui#12522 evidence

Captured from the console (vite, 1280 x 860) against HotCRM's `objectstack dev --fresh`, in a writable package `com.test.pages` with an html page `help_center` (two navigation entries, one inside the group "Support") and a block-tree page `team_home`. Dark and light.

- `12522-html-source-*` — the Source tab with the Monaco editor and the "Saved" status line.
- `12522-html-source-fallback-*` — the same tab with Monaco unavailable: the textarea fallback with its line-number gutter and wrapped lines; the status reads "Saved" for a draft read and not edited in this visit.
- `12522-html-properties-*` — the Properties tab: label, identifier, "Written in", navigation entries.
- `12522-html-run-disabled-*` — the Design / Run switch disabled on the html page, its reason shown on keyboard focus.
- `12522-block-design-*` / `12522-block-run-*` — the block-tree control: Design draws the block canvas (region label, block card, Add block, Add region); Run renders the page as the app does.

Screenshots stay on this branch and never merge into main.
