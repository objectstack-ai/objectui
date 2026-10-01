---
'@object-ui/types': minor
'@object-ui/components': minor
---

feat(types)!: retire `data-table`'s `selectionStyle` and `chatbot`'s `floatingConfig` on both faces, and stop teaching `data-table`'s inline-edit flags as authored keys (objectui#6152, round 5)

**Retired (breaking).** Each key below was declared on a published TypeScript type in
`@object-ui/types` and unknown to its zod mirror in `@object-ui/types/zod`, so the tolerant
validator kept an authored value without examining it. Each is retired at once, with no alias
window:

- `data-table`: `selectionStyle` (`'always' | 'hover'`). The `data-table` renderer in
  `@object-ui/components` honoured `'hover'` by hiding each row's selection checkbox until the
  row was hovered, but nothing in this repository or in `objectstack` authored or produced the
  key. The hover-only branch is removed: a selectable table always shows its row checkboxes,
  which is what `'always'` and an unset key already did. Delete the key; `selectable` alone
  turns selection on.
- `chatbot`: `floatingConfig`. The `chatbot` renderer never read it, so a value on a `chatbot`
  node configured nothing. The trigger and panel it describes belong to the floating
  presentation: author `type: 'chatbot-floating'` with `floatingConfig`. That node's
  `floatingConfig` is unchanged on both faces, and it is still validated member by member.

For each retired key:

- the TypeScript member is now `?: never`, so writing it is a `tsc` error;
- the zod mirror refuses it by name at the key, on the tolerant validator (`AnyComponentSchema`,
  `safeValidateSchema`) and on the strict authoring face (`StrictAnyComponentSchema`) alike. The
  strict face used to refuse it as an unknown key with no guidance; the refusal now says what to
  write instead.

Delete the key from any document or literal that carries it.

**Docs: `data-table`'s inline-edit flags are host-paired.** `editable` and `singleClickEdit`
stay declared on `DataTableSchema`, unchanged, but the `data-table` page no longer teaches them
as keys a document sets. The table only stages an edit, and saving it needs callbacks a host
supplies in code. `object-grid` sets both keys on the table it builds and supplies that save
path; a document that wants inline editing authors an `object-grid`. Their doc comments say
the same.

`@object-ui/types` and `@object-ui/components` are in the fixed release group, so this ships as a
minor bump, per the repository's version policy.
