---
'@object-ui/app-shell': minor
---

feat(app-shell): an assignment value can be written as a CEL expression in the flow designer

The `assignment` node's **Assignments** editor now has a per-value toggle, "Write
as a CEL expression". Off, the value is text: a `{token}` string is stored exactly
as typed, and numbers, booleans and JSON literals are smart-parsed as before. On,
the value is stored as the CEL value envelope `@objectstack/spec` declares for this
slot (objectstack#14149), `{ dialect: 'cel', source }`, so the CEL stdlib
(`joinNonEmpty`, …) can be authored from the designer:

```json
{ "assignments": { "label": "{record.name}", "digest": { "dialect": "cel", "source": "joinNonEmpty(names, \", \")" } } }
```

- The editor reads which maps take an envelope from the spec's expression ledger
  (`FLOW_NODE_EXPRESSION_PATHS`, `value` role). Every other key/value map (action
  params, request headers, record field values, subflow input) is unchanged.
- A malformed envelope (no `source`, a blank one, a non-`cel` dialect) shows the
  spec's `AssignmentValueSchema` refusal beside the cell, and is kept as the object
  it is rather than turned into a string.
- A node still using the legacy `assignments: [{ variable, value }]` array shows the
  spec's prescription for it. Switching one of its values to an expression writes
  the canonical map, the only shape the spec reads an envelope in; the other values
  move across unchanged.
