---
'@object-ui/app-shell': patch
---

fix(app-shell): eight inspector words that already had a catalogue row read it, so zh-CN authors see Chinese there (objectui#10696)

A few designer inspector props passed an English literal although the designer's
own string catalogue already carried the same English under a key with a zh row.
So a zh-CN author read English on an otherwise Chinese inspector:

- the dashboard widget inspector's filter-binding field picker, whose search box
  read `Search fields…`; it now reads `engine.form.searchFields`, the row the
  dataset inspector's field pickers already read;
- the view inspector's object picker, whose search box read `Search objects…`; it
  now reads `engine.inspector.dataset.searchObjects`, the row the dataset
  inspector's object picker already reads;
- the field inspector's lookup `dependsOn` chips, whose remove buttons were named
  `Remove NAME`; they now read `engine.form.removeNamed`;
- the field inspector's lookup and roll-up filter rows, whose value input read
  `value`; it now reads `engine.inspector.condition.valuePlaceholder`, the row the
  condition builder's value input reads;
- the flow edge inspector's decision-branch picker, whose custom entry read
  `— Custom —` and whose unnamed branches read `Branch N`; they now read
  `engine.inspector.flowEdge.branchCustom` (the row the approval-branch picker
  beside it already reads) and `engine.flowRegion.branchN`;
- the flow node inspector's container › region › node breadcrumb for a node
  nested in a `try_catch` or `parallel` region, whose region crumb read `Try`,
  `Catch` or `Branch N`; it now reads `engine.flowRegion.try`, `.catch` and
  `.branchN` through the same `displayRegionLabel` the canvas region header
  already reads, so the canvas and the inspector show the same word. `Body` and
  an authored branch name pass through as before.

No catalogue row is added or changed, and the en-US text is unchanged.

⚠️ **Dated note, 2026-09-27 — a loop body's crumb reads a row — objectui#10748.** Later in
this same release the loop-body region crumb reads its own new row, `engine.flowRegion.body`,
through the same `displayRegionLabel`, so under zh-CN it no longer passes `Body` through; an
authored branch name still does. The paragraph above is kept as the reading of this change; the
objectui#10748 entry states what the crumb now does.
