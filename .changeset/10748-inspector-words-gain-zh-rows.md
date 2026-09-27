---
'@object-ui/app-shell': patch
---

fix(app-shell): designer inspector words that had no catalogue row gain en-US and zh-CN rows, so zh-CN authors see Chinese there (objectui#10748)

objectui#10696 moved the inspector literals whose English already had a row. The
rest had none, so a zh-CN author still read English on an otherwise Chinese
inspector. Each now reads an `engine.*` row — a new one, except four
lookup-operator words that reuse the condition builder's rows — and each en row
carries the English the literal did, so en-US renders the same words:

- the dashboard widget inspector's type select (`KPI Metric` … `Pivot Table`,
  `engine.inspector.widget.type.*`; the stored `type` does not move), its two
  empty-state messages, and the `Widget N` name of an untitled widget, which the
  dashboard inspector's widget list reads too;
- the field inspector's lookup and roll-up filter operators: `= equals`,
  `≠ not equals`, `> greater than` and `< less than` read the condition
  builder's own `engine.inspector.condition.op.*` rows with the symbol kept
  outside the word, and `≥ at least`, `≤ at most`, `contains`, `in (any of)`
  and `not in` read new rows of that family;
- the flow edge inspector's decision-branch picker, whose catch-all branch ended
  in ` · default`;
- the flow node inspector's nested-node breadcrumb, whose accessible name read
  `nested node location` and whose loop-body crumb read `Body` (now
  `engine.flowRegion.body`, through the same `displayRegionLabel` that already
  translates `Try` / `Catch` / `Branch N`), and its Advanced (JSON) box, which
  refused a non-object with `Must be a JSON object`;
- the variable data-picker: its button, search box and empty text, its section
  headings (`Flow variables`, `Upstream outputs`, `Loop item`, `Trigger record`,
  and the approval picker's `Current record (live at node entry)` and
  `Trigger snapshot (at submit)`), and the muted detail beside a reference
  (`variable · TYPE`, `trigger record · OBJECT`, `record values before the
  change`, `prior LABEL`, `prior value`, `pre-update row`);
- the client-side expression shape errors under an expression field, a decision
  branch and an edge condition (a template brace inside CEL, a non-CEL dialect,
  unbalanced parentheses or brackets). The code inside each message reads the
  same in every locale.

References, type names, object names and field labels inside those words are
code or author data and are unchanged.
