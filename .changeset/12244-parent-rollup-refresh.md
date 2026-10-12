---
'@object-ui/app-shell': patch
---

A record page's header totals now update when you edit or delete a row in one of its related lists (objectui#12244). Before, a quote's total in the header highlight strip kept its old value after a line's quantity was edited or a line was deleted, until a browser reload. The server had already recalculated the total.

The record page now reads its record again, in place, when one of its related child objects is written. That covers a related-list row delete, a save from the child form that opens over the page, and a child row action. Nothing is remounted: the page stays on the tab it was on, and the refresh is the same in-place record read a save of the record itself already makes. The page computes no totals itself. It shows what the server returns for the record. A write to an object that is not one of the record's related children does not read the record again.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
