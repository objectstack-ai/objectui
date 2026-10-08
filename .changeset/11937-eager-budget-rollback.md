---
'@object-ui/app-shell': patch
---

The console is back under its first-load budget. Two recent Studio changes are rolled back to get there: the common-rule starting points in an object's Validations "New" menu (objectui#11931), and the Interfaces pillar's step that creates a page and opens it on its source with a live preview (objectui#11932). Their labels sat in a string table every console page loads, which pushed that first load over its limit. Studio behaves as it did before those two changes, and nothing else changes. Both come back once the first-load allowance tracked in objectui#11942 is in place.
