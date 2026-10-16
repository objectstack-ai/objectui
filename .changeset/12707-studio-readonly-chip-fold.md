---
'@object-ui/app-shell': patch
---

Studio: the "Read-only · Customize with an overlay" link at the end of an item's tab row (an open flow in Automations, an open permission set in Access) now folds to its layers icon when the row cannot hold it whole, instead of being cut to "Rea" at the row's edge. The fold follows the tab row's own width, not the window. Folded, the link keeps its text as its accessible name and its sentence as its tooltip, and still leads to the package's metadata directory. The tab labels stay whole and the row keeps scrolling sideways.
