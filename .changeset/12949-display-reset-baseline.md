---
'@object-ui/plugin-list': minor
'@object-ui/app-shell': patch
---

The list toolbar's Display control compares hidden fields and density against the view's own value again (objectui#12949). On a console list, after a user hid a column (or changed the density) and reloaded, "Reset to view default" was disabled and the Display trigger counted nothing, although the list differed from the view. The console lays the user's stored choice over the view's value (objectui#12474), so the list compared that choice with itself. Now the reset is enabled whenever the user's hidden fields or density differ from the view's, the trigger count follows the same comparison, and pressing the reset writes the view's value back through the same doors the controls write through, so the user's stored preference follows, as Show all does.

On a saved view that declares no `columns`, the view's own `hiddenFields` is never applied (objectui#12505), so the view hides nothing there: the reset returns to every drawn column.

**Clause-②: yes (widening)**: the exported `ListViewProps` gains one optional member, `viewDefaults?: Pick<ListViewSchema, 'hiddenFields' | 'rowHeight'>`. A host that lays a user preference over those two schema keys passes the view's own values in it. When it is passed, its members are the whole baseline (an absent `hiddenFields` means the view hides nothing, an absent `rowHeight` means the default density). A host that does not pass it behaves exactly as before: `schema` is the view's own. No key is added to `ListViewSchema`, and no existing member changes type. `@object-ui/app-shell`'s object page passes it; its own exports do not change.
