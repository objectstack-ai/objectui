---
'@object-ui/core': minor
'@object-ui/plugin-list': minor
---

List views read `userActions.editInline` with the spec's default, off, and a view's stored `inlineEdit` folds into it (objectui#5144).

**Breaking for a view that relied on the old default.** The spec declares `userActions.editInline` with `.default(false)`: the list is read-only unless the author opts in. The interface page already read it that way. The object-list toolbar did not: it read an absent `editInline` as "defer to the host", so every console grid offered the inline-edit toggle unless a view said `editInline: false`. The toolbar now reads it as the spec does. A grid view that declares neither `userActions.editInline` nor `inlineEdit` no longer offers the inline-edit toggle, on the wide toolbar or in the compact settings popover, and never opens in edit mode.

**The fold keeps every view that has inline editing.** The console stores the toolbar toggle as the view's `inlineEdit`. `normalizeListViewSchema` (`@object-ui/core`) now folds a boolean `inlineEdit` into `userActions.editInline`, the way it already folds the `show*` flags into the other toggles:

- a stored `inlineEdit: true` reads as `editInline: true`: the toggle is offered and the grid opens in edit mode;
- a stored `inlineEdit: false` reads as `editInline: false`: no toggle;
- an explicit `userActions.editInline` wins over a stored `inlineEdit`, in both directions;
- a view with neither key reads off.

`inlineEdit` stays on the folded view. `ListView` still opens the grid in edit mode from it, and the toggle still writes it through `onInlineEditChange`. Nothing migrates stored views.

**What to do.** A view that should offer inline editing declares `userActions.editInline: true`, or keeps its stored `inlineEdit: true`. With `editInline: true` declared, the toggle stays offered after a user switches it off, and the stored `inlineEdit` decides only whether the grid opens in edit mode. Without it, a user who switches the toggle off stores `inlineEdit: false`, and the view reads off from its next load.

Nothing is added to a package entry: no export, prop, type member or language-pack key.
