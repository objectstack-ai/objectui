---
'@object-ui/plugin-designer': patch
---

The Object Manager stops drawing a delete action it refuses to run
(objectui#9219) — objectui#8674's defect, one component over.

**The defect.** `ObjectManager`'s `handleDelete` returned early on
`obj.isSystem`, before the confirm dialog, while the affordance was wired at the
GRID level (`onDelete={readOnly ? undefined : handleDelete}`) — one callback,
drawn identically for every row. So a system-object row carried a delete entry
whose click produced no dialog, no toast and no console message. That row is on
screen by DEFAULT: `showSystemObjects` defaults to true and the component
filters system objects out only when it is false. `readOnly` was honest in the
same component (the callback is withheld, so nothing is drawn); `isSystem` drew
the entry and swallowed the click. The two states differed in the code and did
not differ on screen.

**The fix.** `ObjectManager` now passes `rowOperations`, the per-row narrowing
objectui#8674 added to `ObjectGrid`, answering `{ delete: !!obj &&
!obj.isSystem }` for each row — the same three lines the Field Designer got.
A system object's row no longer offers Delete at all; an unresolvable row is
withheld too, because `handleDelete` returns early on a missed lookup and
offering delete there would reproduce this very defect.

Edit is untouched. `isSystem` disables the `name` input inside the edit form and
has never meant "this row is untouchable", so the modal still opens for a system
object exactly as before. The guard inside `handleDelete` also stays, as a
second line for anyone invoking that published prop value directly — it is just
no longer the only refusal.

**Why `patch`.** No API surface moves: no prop, type, export or signature is
added, changed or removed, and `rowOperations` is a prop `ObjectGrid` already
published. The only user-visible change is that an entry which never did
anything — the click was dropped before the dialog — is no longer drawn, so
nothing a caller could have depended on stops working. This is the level the
merged sibling repair declared for the same defect in the same package.
