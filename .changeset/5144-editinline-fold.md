---
'@object-ui/core': minor
'@object-ui/plugin-list': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-view': patch
---

List views read `userActions.editInline` with the spec's default, on since objectstack-ai/objectstack#22605 (`editInline: z.boolean().default(true)`), and `editInline: false` is the opt-out. A view's `inlineEdit` folds into it, and the console's inline-edit toggle no longer writes to the view (objectui#5144).

**The spec's default, read as declared.** The spec declares `userActions.editInline` with `.default(true)` (objectstack-ai/objectstack#22605): a list view is editable in place by default, under the permission gate, and `editInline: false` is the opt-out. The object-list toolbar used to read an absent `editInline` as "defer to the host", so every console grid offered the inline-edit toggle unless a view said `editInline: false`. The toolbar now reads it as the spec does. A grid view that declares neither `userActions.editInline` nor `inlineEdit` offers the inline-edit toggle, on the wide toolbar and in the compact settings popover, and opens out of edit mode. The flip of the default, and the interface page that reads it, are the objectui#12086 entry of this release.

**The fold.** `normalizeListViewSchema` (`@object-ui/core`) now folds a boolean `inlineEdit` into `userActions.editInline`, the way it already folds the `show*` flags into the other toggles:

- `inlineEdit: true` reads as `editInline: true`: the toggle is offered and the grid opens in edit mode;
- `inlineEdit: false` reads as `editInline: false`: no toggle;
- an explicit `userActions.editInline` wins over `inlineEdit`, in both directions;
- a view with neither key reads on, the spec's default.

`inlineEdit` stays on the folded view, because `ListView` opens the grid in edit mode from it. Nothing migrates stored views.

**The console toggle is session-only (`@object-ui/app-shell`).** Both keys are the author's permission. The console's toolbar toggle used to store a user's edit mode in the view's `inlineEdit`; after the fold, switching it off would have taken the toggle away for good. It now writes nothing. The toggle switches edit mode for the session, and each load starts from the view's own `inlineEdit`. `ListView` still reports the toggle through `onInlineEditChange`.

**A named view's `inlineEdit` keeps its precedence (`@object-ui/plugin-view`).** On a host's `renderListView`, `ObjectView` merges `userActions` from the node, the host's `views` entry and the active named view, the named view last. The named view's `userActions` now go through the same fold as the other two. So a named view's `inlineEdit` decides whether inline editing is offered ahead of a host entry's, as it already decided the edit mode.

**What to do.** A list whose records are read-only by nature declares `userActions.editInline: false`. A view that declares `userActions.editInline: true` keeps the toggle offered whatever the user does with it. Two costs come with the session-only toggle:

- the edit mode is not remembered across loads;
- a view, or a personalization overlay, where the old toggle stored `inlineEdit: false` still reads off. That is existing data, and it is not migrated. Declaring `userActions.editInline: true` on the view brings the toggle back.

Nothing is added to a package entry: no export, prop, type member or language-pack key.
