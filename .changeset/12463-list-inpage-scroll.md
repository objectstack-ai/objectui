---
'@object-ui/app-shell': minor
'@object-ui/components': minor
---

Console list page: the table scrolls inside the page on desktop, and a right-edge shadow says more columns follow (objectui#12463).

- **The console inset no longer scrolls a self-scrolling page by the height of a banner.** From the `lg` breakpoint up, the console's main area is a flex column: the banners above the route (the draft-preview bar, the unpublished-app bar, `displayType: 'banner'` notifications) sit in one non-shrinking box, and the route content in one route slot that gives up the rest of the height. A page that bounds itself and scrolls inside its own box, as the object list page does, now takes the height left after the banners. Before, it took the full height on top of them: the main area scrolled as a second scroller over the table's own, the record-count footer sat below the fold, and the page header scrolled away once the table reached its end. A natural-height page (search results, the marketplace) keeps its full height inside the slot and still scrolls the main area exactly as before. The phone keeps today's layout.
- **`data-table` draws a right-edge scroll shadow.** While more columns remain to the right of the table's scroll box, a shadow is drawn at the seam before the right-pinned columns (the row-actions column) and clear of the box's scrollbar; at the far right there is none. It replaces the box's static inset shadow, which the cells' own backgrounds covered so it never showed. A grouped grid's sub-tables, which scroll in one shared container, draw none.

The table's header was already sticky inside the box, and the leading cell, the first data column (`frozenColumns`, 1 by default in `object-grid`) and the row-actions column were already pinned; those are unchanged. No prop, schema key, export or language-pack key is added.
