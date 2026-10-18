---
'@object-ui/app-shell': patch
---

The console's success toast no longer covers an open drawer's expand and close buttons and title (objectui#11685).

The toaster stays in the top-right corner (objectui#7482 moved it there, away from the assistant composer). That corner is also where every right-side drawer keeps its chrome, so a toast raised with the record drawer open, after creating a record or running a record action such as Approve, sat on the drawer's expand and close buttons, its title and the record's own header actions. While a right-edge drawer is open, `ConsoleToaster` now offsets the toaster instead:

- When the page left of the drawer is wide enough for a toast, the toaster moves into that strip, against the drawer's left edge. It covers no part of the drawer, and the strip is under the drawer's overlay, so no control sits there.
- When that strip is too narrow (a phone, or a drawer nearly as wide as the window), the toaster drops below the drawer's header.

When the drawer closes, the toaster returns to the corner. It follows the drawer when the window is resized or the drawer is dragged wider or narrower. Every `side="right"` sheet in the console gets the same treatment, the record drawer included. Centred dialogs, popovers, and left or bottom sheets leave the toaster where it is. An `offset` passed to `ConsoleToaster` by its caller still wins.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
