---
'@object-ui/types': minor
---

`LookupFieldMetadata` declares the lookup picker's `allowCreate`, `lookupColumns` and `lookupPageSize` in `@objectstack/spec`'s spelling, each typed by reference to the spec's `FieldSchema` member, and no longer declares `allow_create`, `lookup_columns` or `lookup_page_size` (objectui#12157).

- FROM `allow_create?: boolean` → TO `allowCreate`, typed as `@objectstack/spec/data`'s `Field['allowCreate']`
- FROM `lookup_columns?: Array<string | LookupColumnDef>` → TO `lookupColumns`, typed as `Field['lookupColumns']`: the same shape, a field name or a `{ field, label?, width?, type? }` descriptor
- FROM `lookup_page_size?: number` → TO `lookupPageSize`, typed as `Field['lookupPageSize']`

The `lookup` widget stopped reading the snake spellings in the same change (`@object-ui/fields`). The members follow the readers, so a typed producer cannot write a key that compiles and does nothing. `LookupColumnDef` is still exported.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

TypeScript that writes one of the three snake keys on a `LookupFieldMetadata` literal no longer compiles: an excess-property error names the key. Rename it to its camelCase spelling; the value stays the same. `lookup-field-metadata-spec-spelling-12157.test.ts` pins both directions. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes**: three members join the exported interface in the spec's spelling, and their snake_case twins leave it.
