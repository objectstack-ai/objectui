---
'@object-ui/types': minor
'@object-ui/plugin-detail': minor
---

`DetailViewSchema.related` is retired — author a `record:related_list` block
(objectui#7997, ADR-0049 enforce-or-remove; maintainer ruling 2026-09-10).

**Breaking, and graded `minor` by this repo's convention** — a `major` would drag
the whole 39-package fixed group off `@objectstack`'s cadence. A `detail-view`
node authoring `related` used to parse **green** and render a Related section; it
now reds at that key on both faces, and the renderer draws nothing from it.

**What retired is a DOOR, not the capability.** `record:related_list` is
unchanged and is now the only **declared, protocol-governed** entry
(`@objectstack/spec` `RecordRelatedListProps`); it has always rendered through
the same `RelatedList` component the retired array fed, so nothing about the
rendered result is lost. ⚠️ Not the only entry full stop — `plugin-detail`
still registers a bare `related-list` node against the same component with
untyped `columns`, and that registration is out of this card's scope and
untouched.

| before, on a `detail-view` node | after |
| --- | --- |
| `related: [{ title, type, api, columns: [{ accessorKey, header }] }]` | a `record:related_list` node: `{ objectName, relationshipField, title, columns: ['name', 'email'] }` |

⚠️ `columns` on the surviving entry is an array of **field-name strings**, which
is what the protocol declares. The header is derived from the related object's
field `label` and the cell from the field's type, so a label rename reaches the
list for free — the hand-spelled `{ accessorKey, header }` form froze both.
`relationshipField` names the field on the related object that points back at
this record, and replaces the retired form's `api` endpoint.

**Why it retired.** `@objectstack/spec` declares no `DetailView` schema at all —
every `DetailView` occurrence in `packages/spec/src` is prose about this repo's
own `RecordDetailView.tsx` — so this array mirrored no protocol schema and
drifted freely: it declared `columns` as `TableColumn[]` while the renderer it
fed also accepted bare field names, `{ field, label }` and legacy
`{ name, label }` spellings. The axis that carried the ruling was measured **zero
pull**: no application code authored the member, both internal producers of a
`detail-view` node (`RecordDetailDrawer`, `renderers/record-details.tsx`)
synthesize it without `related`, and the only in-tree authorings carrying real
columns were two documents — both rewritten here.

**A named refusal, not a deletion.** `BaseSchemaCore` ends `.passthrough()` and
the TypeScript `BaseSchema` closes with an any-valued index signature, so a
*dropped* member key is kept, not refused — deleting the declaration would have
left the silent accept exactly as it was. The key stays declared and unwritable:
`retirementTombstone()` on the Zod face, `?: never` on the TypeScript face, one
guidance string feeding both the parse-time message and `.describe()`. A pin
authors an undeclared sibling key through the same parse and watches it survive,
so "a bare delete would not have refused it" is a reading rather than a claim.

**What moved in `@object-ui/plugin-detail`.** `DetailView` no longer reads
`schema.related`: the flat Related section, the `autoTabs` Related tab, its
trigger and its count badge are gone, and `related` is off the `detail-view`
registry's `inputs` and `defaultProps`. `RelatedList` itself, the
`related-list` / `related_list` registrations and `record:related_list` are
untouched.

**Documentation.** `packages/plugin-detail/README.md` and
`content/docs/api/schema-reference.md` stop teaching the retired array and gain a
migration block each.

⚠️ The docs page had been teaching `{ name, label }` columns, and the two faces
disagreed about that shape: the retired **TypeScript** declaration never
admitted it (`TableColumn` requires `header` **and** `accessorKey`), while the
retired **zod mirror** did — it spelled the member `z.array(z.any())` — so the
JSON document that page taught parsed green and rendered. The page was wrong for
a **typed** author and right for a **JSON** author, which is a sharper defect
than a single wrong example: the two authoring faces of one member disagreed
about what a column is. Retiring the member closes that split at the source, and
the page now teaches `record:related_list`, whose `columns` is
`z.array(z.string())` on both faces.
