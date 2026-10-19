---
'@object-ui/app-shell': patch
---

Setup's metadata lists keep a row's controls in reach on a narrow screen, and say in words when the activation state cannot be read (objectui#13091).

- **Pinned controls.** The list table scrolls inside the shared horizontal-overflow box. In the environment scope, the Active switch and, on the declared sharing rules, Clone are pinned to its right edge, with the seam shadow on the first of them while columns remain to the right. The Source column now comes before Active, so the pinned pair is the row's last two cells. At 1440 px the declared sharing rules no longer put Clone off-screen or cut the Active switch. The table draws its borders separated, with the row dividers on the cells, so no text scrolling beneath a pinned cell shows through its edge.
- **Unreadable state.** When the activation ledger read is refused or fails, the Active cell reads "Not visible to you" instead of `?`. Its tooltip carries "Activation state could not be read." followed by the server's own sentence for why, or the HTTP status when the server gave none.

One new string in the metadata-admin designer's own tables (en and zh): `engine.catalog.active.notVisible`. No export, prop or type member changes.
