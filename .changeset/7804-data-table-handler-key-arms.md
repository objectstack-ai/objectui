---
'@object-ui/types': minor
---

`DataTableSchema` declares the seven handler keys its registered renderer reads:
`onAddRecord`, `onBatchSave`, `onCellChange`, `onColumnResize`, `onRowActionDef`,
`onRowClick` and `onRowSave` (objectui#7804, the `DataTableSchema` slice).

`BaseSchema` is `.passthrough()`, so a key no arm declares is not refused — it
stops being judged and the value is KEPT. All seven were in that state while
`renderers/complex/data-table.tsx` read and INVOKED each one, so an authored
`{ "type": "data-table", "onRowClick": { "action": "toast" } }` parsed GREEN and
that action object was handed to a call site expecting a function. Each key is
now a named refusal on the mirror (`handlerKeyRefusal`, the objectui#6124 shape),
and the arm's message says why JSON cannot author it and what to write instead.

Accept-set change on the published validator, stated plainly — this NARROWS:

- REFUSED where it was accepted: any value at all on these seven keys of a
  `data-table` node, including the `{ "action": … }` object shape a declarative
  author would reach for. Previously accepted and kept; now refused by name with
  remediation text, at `code: 'custom'` on the key's own path.
- Measured before choosing this level: NOTHING in this repository authors any of
  the seven as metadata — not in `examples/`, not in `apps/`, not in the schema
  catalog, not in a doc fence. The JSON key spelling reads zero across the whole
  document corpus while the lit controls on the same corpus (`"searchable"`,
  `"pageSize"`, `"columns"`) all fire, so the zero is a reading and not a
  silence. Every textual hit on these names is prose about React props.
- TS face UNCHANGED: all seven keep their function types, because the value
  genuinely reaches the renderer — the programmatic channel is the TypeScript
  interface and React props, never `safeParse`. The disposition was measured per
  key rather than applied as a pattern: six arrive as React props a host hands
  `ObjectGrid` or `RelatedList`, which forward them onto the `data-table` node
  they build, while `onColumnResize` has no host prop anywhere and is supplied by
  `ObjectGrid`'s own closure. `'retired'` would have published "no renderer reads
  this key" for seven keys a renderer demonstrably reads.

No renderer behaviour changes; a host that supplies these functions in TypeScript
is unaffected, and `check:handler-key-reads` drops the seven ledger rows that
waived them.
