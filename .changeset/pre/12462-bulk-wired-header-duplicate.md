---
'@object-ui/app-shell': minor
---

The console list page's header no longer draws a copy of an action that the selection bar already carries (objectui#12462).

A `list_toolbar` action leaves the header when two things hold. First, the active list view wires it to the selection bar, by naming it in `bulkActions` or in a `bulkActionDefs` entry. Second, the action is record-scoped: its `locations` also include `list_item` or a `record_*` placement. The selection bar is the list toolbar in its selection mode, so the action is still drawn at its declared placement, on the rows it acts on. Only the header's permanent copy goes. Launched from the header, such an action ran only with exactly one row ticked, and the bar covers that case.

What stays as it was:

- An object-level action (declared at `list_toolbar` alone) keeps its header button even when a view wires it as a bulk action, because it can run with nothing selected.
- A view that does not wire the action keeps the header button.
- The selection bar, the row menu and the action metadata are unchanged.

A `?runAction=` deep link to an action that left the header is not armed on that view. Nothing runs, and the link stays in the URL, as for any action name the header does not draw. On a view that does not wire the action, the link arms and runs it as before. The `sys_environment` list's toolbar receives the same list.

On HotCRM's Leads list (`all_leads` wires `create_campaign` in `bulkActions`), the header no longer draws "Add to Campaign". Ticking rows floats the selection bar with it.

No type, prop, option or export changes.
