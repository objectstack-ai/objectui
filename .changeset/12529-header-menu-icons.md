---
'@object-ui/app-shell': patch
'@object-ui/components': patch
---

Record page header `⋯` menu: the system entries (Edit, favorites, Share, Delete) now carry icons (pencil, star, share, trash) like the app's own actions; the menu lists authored actions first, then the system entries with Edit leading, and sets every destructive entry (Delete) apart at the bottom behind a separator. When the app's actions fill the header row and Edit folds into the `⋯`, an icon-only Edit button stays beside the `⋯` and opens the same edit session (objectui#12529).
