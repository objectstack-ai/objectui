---
'@object-ui/app-shell': patch
---

Marketplace cards show the whole app name, and the id keeps its package name (objectui#12616).

The card header put the publisher badge in the same row as the title. The badge took its width first, and the title and id got what was left. At a 1024px viewport under the Setup sidebar, the HotCRM card's title read "H…" and its id "ap…".

- **The title takes the text column first.** It is 13px semibold and wraps to two lines at most, with an ellipsis after the second. The clamp is visual only: the whole name stays in the page text, so a screen reader reads it whole.
- **The badge has its own line under the title.** This applies to the publisher badge on a catalog card and the visibility badge on a "Your organization" card.
- **The id is cut in the middle, and only when it does not fit.** It is 11px monospace on one line. A card wide enough for the whole id draws it whole; a narrower card keeps the id's start and its package name, with "…" between them (`app.objec…hotcrm`). Hovering it shows the whole id, and the page text is always the whole id.
- **Cards are at least 240px wide.** The catalog, the "Your organization" section and the loading placeholders fit as many cards as the page width holds (`repeat(auto-fill, minmax(240px, 1fr))`), in place of a fixed number of columns at each viewport breakpoint.

The marketplace data, the install flow, the card's click target and its test ids are unchanged. Nothing is added to the package entry: no export, prop or type member.
