---
'@object-ui/plugin-list': minor
'@object-ui/app-shell': minor
---

The console list page draws its saved-view tabs and the list's Filter, Sort, Display and Search controls on one row (objectui#12440).

- **One row for tabs and tools.** From the `sm` breakpoint up, the view tab strip is no longer a bordered row of its own above the list: it sits at the left of the list toolbar, takes the width the four controls leave, and folds the views that do not fit into its "N more" menu. Its "+" add-view button comes with it. Below `sm` nothing changes: there is no tab strip, and the app bar's view switcher stays the phone's view control. A view the server refuses still shows the tabs on their own row, since no list (and so no toolbar) is drawn for it.

For integrators: `ListView` takes a `toolbarLeading` React prop. A host node passed there renders first in the toolbar row's left group, before the user-filter chips, in a `min-w-0 flex-1` wrapper. It is a host prop, not a schema key. Without it the toolbar row is unchanged.
