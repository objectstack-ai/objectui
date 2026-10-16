---
'@object-ui/plugin-list': minor
'@object-ui/app-shell': minor
---

List views read an absent `userActions.editInline` as on, the v18 protocol default (objectui#12086, the consumer half of objectstack#22605). A list view is editable in place by default, under the permission gate that already exists, and `userActions: { editInline: false }` makes it read-only in place.

**A list view that declares neither key.** The maintainer's v18 ruling flipped the spec's `ListViewSchema.userActions.editInline` from `.default(false)` to `.default(true)`. `ListView` (`@object-ui/plugin-list`) reads an absent `editInline` as on (`!== false`). A grid view that declares neither `userActions.editInline` nor `inlineEdit` offers the inline-edit toggle, on the wide toolbar and in the compact settings popover, and opens out of edit mode. The previous release offered it there too, reading an absent key as "defer to the host"; objectui#5144 read it off on unreleased `main` only, and its entry in this release states the default as on. The fold objectui#5144 added is unchanged.

**Behaviour change: the ADR-0047 interface page (`@object-ui/app-shell`).** The page reads its config's `userActions.editInline` with the same default and hands it to `ListView` as the grid's edit mode, because the page wires no inline-edit toggle. A page that declares nothing now opens its grid editable in place; `editInline: false` keeps it read-only.

**Unchanged.**

- The permission gate. The toggle, the compact entry and the edit mode are offered only where the object is editable in place and the current principal holds `update` on it. A principal without the grant sees no toggle.
- The `inlineEdit` fold (objectui#5144): `inlineEdit: true` reads on and opens the grid in edit mode, `inlineEdit: false` reads off, and an explicit `editInline` wins either way.
- The console toggle stays session-only (objectui#5144, ruling E).

**What to do.** A list whose records are read-only by nature (a log, an audit trail, a history, a roll-up) declares `userActions: { editInline: false }`. A view or overlay where an earlier console stored `inlineEdit: false` still reads off; declaring `userActions.editInline: true` brings the toggle back.

Nothing is added to a package entry: no export, prop, type member or language-pack key. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own behaviour changes ship as `minor` with the semantics stated here.)
