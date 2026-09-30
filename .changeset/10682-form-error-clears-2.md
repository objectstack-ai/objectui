---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the line-items panel clears its load error when a later load commits rows (objectui#10682, objectui#10683)

The `record:line_items` panel (`LineItemsPanel`) shows one banner, written by a
failed load and by a failed save. Only the start of a save cleared it, so after
a failed load the banner stayed over the rows a later load drew, and after a
failed save it stayed over the rows a later load put in place of the edits it
was about. Now only the current load writes that banner. When it commits rows it
clears the banner, whether it holds a failed load's message or a failed save's.
A load that fails shows its own failure instead. A load that another has
superseded (another parent record, say, while it was in flight) neither raises
the banner nor clears it. This is the rule objectui#10578 set for `ObjectGantt`:
the error is cleared when the current load commits, never when a load starts.
