---
'@object-ui/plugin-report': patch
'@object-ui/plugin-form': patch
---

fix(plugin-report,plugin-form): a dataset report and an authored-parent `record:line_items` panel re-read on the data-invalidation bus

The one fetch every dataset report presentation runs through (the tabular and
summary table, the matrix, the embedded chart, each joined block) now names the
`useDataInvalidation` nonce for the dataset's base object, the object the
query's answer names. So a write declared on the bus (`notifyDataChanged`, as a
page action over raw HTTP does) re-reads a `report` / `spec-report` block in
place: the rows on screen stay drawn until the answer replaces them, where
before the block dropped back to "Running report…". The `spec-report` a
drill-down drawer opens for `drillDown.report` re-reads the same way. A report
whose answer names no object does not subscribe. A re-read that fails shows the
error in place of the rows and keeps listening, so the next such write re-reads
the report; a first load that fails, or a new selection, listens to nothing
until an answer names its object.

The child-row read of `record:line_items` now names the nonce for its child
object, so a panel with an authored `parentId` / `recordId` (one a stored page
holds with no record context) re-reads its lines after such a write. A re-read
of the lines on screen keeps the grid drawn, taking no input until the answer
lands. While the panel holds unsaved edits the re-read is held, and the save's
reload carries it, as for any other re-read of this panel.

Before, both refreshed after such a write only when their host remounted them,
and `PageView` is about to stop doing that (objectui#10519).
