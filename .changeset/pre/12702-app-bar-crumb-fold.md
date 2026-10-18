---
'@object-ui/app-shell': patch
---

The app bar's breadcrumb folds instead of cutting every segment short (objectui#12702).

- **The crumbs fold from the left.** Where the crumbs after the app pill do not fit the bar's left group (Setup › System › Marketplace at 1024 px read 「S… / PREVIEW / Sys… / Market…」), every crumb but the last collapses into one `⋯` menu that lists them as plain text. The app pill keeps its full label and the last crumb its full text. The fold is measured from the left group's own width, so it follows what the pill and the crumbs actually need, in any language. Where they fit, every crumb is drawn in full; a crumb is no longer capped at 160 px.
- **The PREVIEW chip moves after the crumbs** when they fold, and where even the folded row has no room for it (Setup › System › Marketplace at 1024 px), it is not drawn, so the pill and the last crumb keep their full text. With room it stays beside the pill. Routes that draw no crumb (an object, dashboard or page route) are unchanged.
- **The search field keeps its width down to 960 px**, and is the icon button below it (it switched at 1024 px).
