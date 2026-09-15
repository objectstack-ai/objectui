---
'@object-ui/types': minor
---

The four plain `objectql.ts` node faces declare the nine handler keys their
registered renderers read (objectui#7804, the `objectql.ts` slice):
`ObjectFormSchema.onCancel` / `.onError` / `.onOpenChange` / `.onStepChange` /
`.onSuccess`, `ObjectGallerySchema.onCardClick` / `.onRowClick`,
`ObjectGridSchema.onNavigate` and `ObjectViewSchema.onNavigate`.

`BaseSchema` is `.passthrough()`, so a key no arm declares is not refused — it
stops being judged and the value is KEPT. All nine were in that state while a
registered renderer read and INVOKED each one, so an authored
`{ "type": "object-form", "objectName": "a", "mode": "create", "onSuccess": { "action": "toast" } }`
parsed GREEN and that action object was handed to a call site expecting a
function. Each key is now a named refusal on the mirror (`handlerKeyRefusal`,
the objectui#6124 shape), whose message says why JSON cannot author it and what
to write instead.

Accept-set change on the published validator, stated plainly — this NARROWS:

- REFUSED where it was accepted: any value at all on these keys of the node they
  belong to, including the `{ "action": … }` object shape a declarative author
  would reach for. Previously accepted and kept; now refused by name with
  remediation text, at `code: 'custom'` on the key's own path.
- REFUSED one level deeper too, and this is a consequence rather than a separate
  decision: `ObjectViewSchema`'s nested `form` and `table` config slots are the
  `object-form` / `object-grid` mirrors BY REFERENCE, and the declaration types
  them off `ObjectFormSlotKey` / `ObjectGridSlotKey` — two unions that list
  exactly these handler keys. So an authored `form: { onSuccess: … }` on an
  `object-view` node is refused as well. Working around that by omitting the
  keys from the nested reference would keep accepting an un-authorable function
  value one level down, which is the defect and not the fix.
- Measured before choosing this level: NOTHING in this repository authors any of
  the nine as metadata — not in `examples/`, not in `apps/`, not in the schema
  catalog, not in a doc fence. Across 2603 tracked `.json` / `.md` / `.mdx` /
  `.yml` / `.yaml` files the JSON key spelling reads zero for every one (the
  three textual hits are changeset PROSE from this card's earlier slices,
  quoting the defect); across 274 `apps/` + `examples/` TypeScript sources every
  hit is a React prop on a JSX element or a local component's own prop; across
  471 `examples/schema-catalog` files the one hit is the substring inside
  `GPUInitializationError`. Lit controls fired in the same pass on every corpus
  (`"objectName"`, `"gallery"`, `"titleField"`, `"layout"`, `"object-form"`), so
  each zero is a reading and not a silence.
- TS face: the seven keys already declared keep their function types, because
  the value genuinely reaches the renderer — the programmatic channel is the
  TypeScript interface and React props, never `safeParse`. The two
  `ObjectGallerySchema` keys are DECLARED here for the first time, which narrows
  that face too: they were reaching the renderer through `SchemaRenderer`'s
  props spread while `BaseSchema`'s index signature admitted them as `any`.
- The disposition was measured per key rather than applied as a pattern, and
  three of the nine do not share the group's supplier: `ObjectFormSchema.onStepChange`,
  `ObjectGallerySchema.onCardClick` and `ObjectGridSchema.onNavigate` have no
  in-repo host filling them, though each channel is wired end to end and each
  key is still read and still run. `'retired'` would have published "no renderer
  reads this key" for nine keys renderers demonstrably read.

No renderer behaviour changes; a host that supplies these functions in
TypeScript is unaffected, and `check:handler-key-reads` drops the nine ledger
rows that waived them, leaving 20.
