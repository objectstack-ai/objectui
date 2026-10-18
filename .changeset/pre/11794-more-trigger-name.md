---
'@object-ui/app-shell': patch
---

The Studio header's *More* trigger keeps its own name (objectui#11794). While *Access*, the pillar it holds, was open, the trigger renamed itself to "Access", which hid the word that says this control is the overflow menu. It now always reads *More*, the same rule the Data pillar's *Advanced* trigger follows. It still takes the active pillar styling while one of its pillars is open, and inside the menu that pillar's link is marked as the current page (`aria-current="page"`), so assistive technology reads where the author is.
