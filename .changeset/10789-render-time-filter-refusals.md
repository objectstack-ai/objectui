---
'@object-ui/core': patch
'@object-ui/react': patch
'@object-ui/fields': patch
'@object-ui/plugin-charts': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/plugin-report': patch
'@object-ui/plugin-list': patch
---

A filter refused as malformed (`INVALID_FILTER`) no longer throws out of render or out of a click
handler at the sites that merge filters there. That holds whether this layer's filter converter
refused it or, at the drill seam, the spec's own `parseFilterAST`. Each site now surfaces the
refusal the way its siblings already do (objectui#10789). The filter stays **refused**: nothing
that was refused is accepted, and no site falls back to "no filter".

- **`ElementDataSourceGate` / `useElementDataSource`** (`@object-ui/react`): the gate's merge of
  the component's `filter` with the composed binding, and the merge of a saved view's filter
  with the binding's own, lowered through the throwing converter inside render. A refused
  filter from either now makes the binding `missing` with a new optional `filterRefusal` on the
  result (`error` carries its message). The gate then draws, in place of the block, the
  malformed-filter notice the wrapped blocks draw: `view.malformedFilter`, naming the refused
  operator or field. `element:record_picker`, which reads the same hook, shows its
  configuration-error panel with the refusal.
- **`PeoplePicker` / `RecordPickerDialog`** (`@object-ui/fields`): the recents merge and the
  dialog's `mergedFilter` lower through `toFilterNodeSafely`; a refusal is shown in the picker's
  existing error state and no query runs without the filter.
- **Drill-downs** (`ObjectChart`, `ObjectPivotTable`, `DatasetWidget`, `DatasetReportRenderer`):
  a widget or report filter refused at the drill seam made the drill click throw. The converter
  refuses some (a spec `$not`, say). The spec's `parseFilterAST` refuses others, such as a scalar
  on a list operator in either dialect: `[['stage', 'in', 'won']]` or `{ stage: { $in: 'won' } }`.
  The drill is now not opened or emitted (never with the scope dropped), and the refusal is logged
  with `console.warn`, naming the operator. `composeDrillFilter` (`@object-ui/core`) now throws
  one refusal type: the spec's `INVALID_FILTER` error is re-raised as a `FilterOperatorError` with
  its message and the same `INVALID_FILTER` / 400 envelope, and any other error passes through
  unchanged.
- **`ListView` export** (`@object-ui/plugin-list`): the server export builds its filter inside
  its `try`, so a refusal is named in the export menu instead of escaping the click.
- **`convertFiltersToAST`** (`@object-ui/core`): an `$or` member that is the TRUE identity no
  longer stops the members after it from being read. `{ $or: [{}, { a: {} }] }` is now refused
  like `{ $or: [{ a: {} }, {}] }` already was, instead of answering TRUE (every row); a TRUE
  disjunct beside members that lower still absorbs its `$or`.
