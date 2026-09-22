---
'@object-ui/plugin-view': patch
---

fix(plugin-view): a read-only view's menus no longer open empty, or on a leading rule

On an object whose views are all code-defined — `ObjectView` stamps `readonly: true`
on any view with no overlay row behind it — clicking the `…` on a row in **Manage
views** opened a popover with nothing in it. Measured in a browser rather than
described: `role="menu"` came back `{ width: 180, height: 10 }` with an empty
`innerHTML`, which renders as a thin strip of `bg-popover` straddling the row's
bottom border. A user reads that as a menu clipped or hidden behind the dialog. It
was not occluded; it had no entries.

Both menus guarded on whether a **callback was wired** while every entry beneath
them is *also* gated on `!isReadonly`. The one entry `readonly` leaves standing is
Duplicate, which the console deliberately does not wire (objectui#1520) — so on a
read-only row the guard passed and the contents all dropped out. `ViewTabBar` had
the same seam plus a second one: each separator stated its own condition rather
than asking whether anything rendered above it, so a read-only tab's dropdown and
context menu opened on a leading `role="separator"` above their single "Manage all
views…" entry.

Each menu now derives the trigger, every entry, and every separator from one set of
flags, so the trigger and its contents cannot answer different questions again: a
menu that would be empty is not offered, and a rule renders only when an entry
precedes it. The read-only row's lock also carries its reason on hover now, as the
tab bar's lock already did — with the `…` withheld, the lock is the only thing left
that explains the row.

The same seam closes one entry that was never gated at all: the dialog's Rename read
`!isReadonly` alone, while its commit path is `onRename?.(…)` — so a host that wired
no `onRename` still got an entry that started an edit nothing could save, and the
trigger counted that entry as one that would survive. Rename is now offered only
when the host can carry it out, like every other row action.

⛔ Not addressed here, and not a regression this introduces: whether a code-defined
view should be read-only in the first place (`ObjectView` classifies
`isSystem = !saved`), and `ViewTabBar`'s `allReadonly` rule, which hides the
per-tab lock when *every* view is read-only — on an object with exactly one such
view that removes the last on-screen signal. Both are product decisions, recorded
on objectui#10209.
