---
'@object-ui/plugin-grid': patch
---

`object-grid`'s header arrows read the ONE declared `sort` spelling — a retired
string no longer paints a pre-click arrow (objectui#8961, maintainer ruling
2026-09-15, letter A).

**What a user saw.** A view authored `sort: "name desc"` lit a descending arrow
on the `name` header *before anyone clicked anything*, while the query that
fetched those rows carried no ordering at all. The arrow stated something about
the list that was not true of the rows beside it, and the first click on that
column then asked for `asc` on a list that was in no declared order. The only
signal was a `console.error` no end user reads.

**Why the two halves disagreed.** objectui#8221 retired the legacy string
clause — one spelling, the array, everywhere — and objectui#8767 made this
block's fetch path REFUSE a string `sort` and send no `$orderby`. That ruling
deliberately left the other reader of the same key alone: `parseSchemaSort`,
which feeds the header indicators, went on parsing `"name desc"` and
`["name desc", …]`. One key, two readers, opposite answers.

**What changes.** `parseSchemaSort` admits only `[{ field, order }, …]` — the
spelling `@objectstack/spec` declares for `ObjectGridPropsSchema.sort` and the
only one the fetch path still lowers. A retired string yields nothing, so it
lights no arrow, matching the query it produces. The refusal is per entry: a
mixed array still shows the arrows for the keys spelled in the declared form.

**No second diagnostic.** The author is already told once per spelling by the
shared reporter at the fetch path, which quotes the offending value and
prescribes the array form. Narrowing the header reader adds no new message.

**Migration.** Write the array: `sort: [{ field: 'name', order: 'desc' }]` —
the same edit the fetch path has required since objectui#8767. A declared entry
with no `order` still reads ascending; that behaviour is unchanged.

**What is deliberately unchanged.** The wire shape. This block still lowers its
array arm to its own `"field order"` join string; routing the key through the
shared sink's `{field: direction}` map is route B on objectui#8767, which stays
declined until the protocol declares that shape (`$orderby` is declared
`string | string[]`). The server-side export path reads `schema.sort` itself
rather than through `parseSchemaSort`, so it was already array-only and does
not move.
