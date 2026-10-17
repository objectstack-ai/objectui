---
'@object-ui/app-shell': patch
---

A Studio item's title no longer disappears beside the header's actions on a narrow window (objectui#12897).

On an Interfaces view leaf of a read-only package, with a 1010 px window and the copilot open, the item header drew its icon, its kind chip, the "Read-only · Customize with an overlay" link, "Open in Data" and the more menu, and the item's title got no width at all. The actions slot never gives way, so it took the whole row. The read-only link now folds to its glyph in the title row as it already does at the end of a tab row: it folds when the title would otherwise be cut, and shows its text again once the title fits beside it whole. Folded, its text stays its accessible name and its title stays its tooltip. A title that is still cut shows its whole text in its tooltip, before the internal id the Interfaces pillar puts there. Every action stays in the row. Nothing changes where the title already fits, such as the same leaf at 1280 px.

Clause-②: no

No export, prop, type or language-pack key changes.
