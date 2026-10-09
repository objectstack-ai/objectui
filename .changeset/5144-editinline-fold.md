---
'@object-ui/core': minor
'@object-ui/plugin-list': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-view': patch
---

List views read `userActions.editInline` with the spec's default, off. A view's `inlineEdit` folds into it, and the console's inline-edit toggle no longer writes to the view (objectui#5144).

**Breaking for a view that relied on the old default.** The spec declares `userActions.editInline` with `.default(false)`: the list is read-only unless the author opts in. The interface page already read it that way. The object-list toolbar did not: it read an absent `editInline` as "defer to the host", so every console grid offered the inline-edit toggle unless a view said `editInline: false`. The toolbar now reads it as the spec does. A grid view that declares neither `userActions.editInline` nor `inlineEdit` no longer offers the inline-edit toggle, on the wide toolbar or in the compact settings popover, and never opens in edit mode.

**The fold.** `normalizeListViewSchema` (`@object-ui/core`) now folds a boolean `inlineEdit` into `userActions.editInline`, the way it already folds the `show*` flags into the other toggles:

- `inlineEdit: true` reads as `editInline: true`: the toggle is offered and the grid opens in edit mode;
- `inlineEdit: false` reads as `editInline: false`: no toggle;
- an explicit `userActions.editInline` wins over `inlineEdit`, in both directions;
- a view with neither key reads off.

`inlineEdit` stays on the folded view, because `ListView` opens the grid in edit mode from it. Nothing migrates stored views.

**The console toggle is session-only (`@object-ui/app-shell`).** Both keys are the author's permission. The console's toolbar toggle used to store a user's edit mode in the view's `inlineEdit`; after the fold, switching it off would have taken the toggle away for good. It now writes nothing. The toggle switches edit mode for the session, and each load starts from the view's own `inlineEdit`. `ListView` still reports the toggle through `onInlineEditChange`.

**A named view's `inlineEdit` keeps its precedence (`@object-ui/plugin-view`).** On a host's `renderListView`, `ObjectView` merges `userActions` from the node, the host's `views` entry and the active named view, the named view last. The named view's `userActions` now go through the same fold as the other two. So a named view's `inlineEdit` decides whether inline editing is offered ahead of a host entry's, as it already decided the edit mode.

**What to do.** A view that should offer inline editing declares `userActions.editInline: true`. The toggle then stays offered whatever the user does with it. Two costs come with the session-only toggle:

- the edit mode is not remembered across loads;
- a view, or a personalization overlay, where the old toggle stored `inlineEdit: false` still reads off. That is existing data, and it is not migrated. Declaring `userActions.editInline: true` on the view brings the toggle back.

Nothing is added to a package entry: no export, prop, type member or language-pack key.
