---
'@object-ui/plugin-grid': patch
---

A `dependsOn` declared on a **bulk action lookup param** now gates, **ungates** and
filters the picker (objectui#8755). The third and last surface that reads
`CASCADE_OPTION_WIDGET_TYPES`, after the object form and — since objectui#8672 ruling
A — the single-record action dialog.

**What was broken.** `BulkActionDialog` threaded its live record (`dependentValues`) to
the option widgets only — `select` / `multiselect` / `radio` / `checkboxes`. A `lookup`
param is in none of those, so `LookupField` fell through to the `SchemaRendererContext`
tail that is unconditionally empty (nothing can populate a member the type does not
declare, objectui#7206), `dependenciesMissing` could never clear, and the trigger
rendered **disabled forever** — prompting for the very param the user had just filled.

**Why this is a consistency fix and not a new authoring route.** `dependsOn` was already
a live, honoured key on a `BulkActionParam`: `bulkParamToField` does not destructure it
out, so it rides the `...extra` spread onto the field bag, and the option widgets have
read it through `useCascadingOptions` since objectui#4757. One of the two widget families
that read the same key off the same bag was never handed the record. Retiring the key
instead — the other disposition objectui#8755 weighed, ADR-0049 enforce-or-remove — would
have deleted a capability that ships.

**Unchanged on purpose.** `CASCADE_OPTION_WIDGET_TYPES` gains no member: it is shared
verbatim with the object form's cascade-clear loop and with `ActionParamDialog`, and it
means "this widget's offered *option set* is re-resolved", which a lookup has none of.
The dialog ORs a second family beside it instead — the shape the object form has shipped
all along. Nothing about the cascade itself is new; `LookupField` has always turned
`dependsOn` into a hard `$filter` shared by the quick-select popover, the Level-2 table
picker and PeoplePicker. This supplies the one input no host could otherwise deliver.

⚠️ **The bulk param schema does not license the key, and must not be cited as if it did.**
`@objectstack/spec`'s `BulkActionParamSchema` "accepts" `dependsOn` — and accepts a
nonsense key in the same run, because it is not strict; the strict sibling
`ActionParamSchema` refuses both. That accept is a **null reading**, pinned with both
controls in `plugin-grid/src/__tests__/bulkLookupDependsOnReach-8755.test.tsx` leg B.
Whether the key should become authorable *by contract* here — by closing that schema, or
by giving the bulk surface the field-backed param route `resolveActionParams` gives the
single-record dialog — is upstream of this repository and stays open.

Also in `plugin-grid`: the `dependsOn` row of `relationalMetaKeys.ts` carried the
sentence "The grid supplies no dependent values, so that gate is permanent". Measured
stale — objectui#7165, finished by objectui#7188, gave the inline cell editor the
dependent record. The corrected note points at the test that re-derives the claim instead
of restating an answer.
