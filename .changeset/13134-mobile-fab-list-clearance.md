---
'@object-ui/plugin-grid': patch
'@object-ui/app-shell': patch
---

At phone width the console's floating create button no longer covers the last card of a list (objectui#13134).

- **The phone card list scrolls in a box of its own.** Below 768px `ObjectGrid` draws stacked cards instead of the table. The table scrolls in its own body; the card list had no scroll box and was drawn straight into its host, and the console's list host clips. A card list taller than the screen was cut off with nothing to scroll, and no room could be made at its end. The cards now scroll in a box marked `data-fab-clearance`, which a host that floats a button over the list can pad.
- **The console list leaves room for its create button.** While the object-list page draws its phone create button, the end of that scroller gets 12rem of room (the button's 9rem offset from the bottom plus its 3rem height), so the last card scrolls clear of it. Where the button is not drawn (create not offered, or `sm` and up) there is no added room.

Nothing is added to a package entry: no export, prop or schema key. `data-fab-clearance` is a DOM marker, like `data-fab-yield`.
