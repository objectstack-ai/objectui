---
'@object-ui/app-shell': patch
---

fix(app-shell): a Studio pillar whose draft load is cancelled no longer leaves its canvas on "Loading…" (objectui#11331)

Each Studio pillar's draft-load effect raised `loading` when a load started.
Only the load's own `finally` lowered it, behind `if (!cancelled)`. A load
that the effect's cleanup cancelled therefore never lowered it. When the next
run started no load of its own, the canvas showed the spinner for good:

- **Interfaces:** an author who opened a leaf with no designer (a report, say)
  while the first leaf's draft was still loading saw "Loading…" until they
  opened another editable leaf.
- **Data:** when the metadata client changed identity while an object was
  loading, the re-run skipped the load because the object counted as already
  loaded. The cancelled load had installed nothing, so the object stayed on
  "Loading…".

A load cancelled before it settles now takes back what its start claimed. In
all three pillars (Interfaces, Data and Automations) that is the `loading`
flag. In the Data pillar it is also the load-once claim, so the re-run loads
the object. A load that settled keeps its claim, so a new client after the
object loaded still never re-reads it over an edit in progress.
