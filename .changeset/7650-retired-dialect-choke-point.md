---
'@object-ui/core': minor
---

Canonicalize the retired object-schema dialect once, at the ingestion choke point
(objectui#7650).

`normalizeSchemaReferenceKeys` now has two arms. The `reference` / `reference_to` pair
is unchanged. The new arm folds any key a served field def carries that
`@objectstack/spec`'s `FieldSchema` does **not** declare, but whose snake/camel twin it
does — `display_field` onto `displayField`, `lookup_filters` onto `lookupFilters`, and so
on.

**The accepted set is MEASURED, not enumerated — and it grows with the linked spec**
(corrected on objectui#8938; this paragraph previously read as though the keys the cards
in this family happened to name were the whole of it). One spelling rule is applied to
`FieldSchema`'s **entire** declared key set at run time, so the accepted set is a property
of the installed `@objectstack/spec` and widens the moment the spec grows a camel key.
Besides the four above, today's spec puts the gate keys `visible_when` / `readonly_when` /
`required_when`, `default_value`, `required_permissions`, `masking_rule`, `track_history`,
`delete_behavior`, `external_id`, `depends_on`, `lookup_page_size`, the `related_list*` and
`inline_*` families, and the managed-by lock keys `_lock_reason` / `_lock_source` /
`_lock_docs_url` / `_package_id` / `_package_version` inside it — and case / kebab variants
of every one of them fold too. A stored legacy spelling of any of these is therefore
**active** on the client where consumers previously ignored it.

No count of that surface is written here on purpose: it is derived from the installed spec,
and a number in this paragraph would be derived once and never again. The instrument that
re-derives it on every run is the pin named `the width IS the spec's declared key set, not
a list anyone typed`, beside the classes above as a live membership assertion.

**Why this is needed at all.** The object-schema serve path never parses:
`ObjectStackAdapter.getObjectSchema` fetches the document, applies two mutations and
returns it, with no `ObjectSchema.parse` anywhere. `FieldSchema` strictness therefore
gates the metadata **write** door only. A document stored before a key was tightened is
served back verbatim, forever — it cannot be re-saved through the strict door, but nothing
ever asks it to be. objectui#7155, #7166 and #7435 narrowed the consumer reads to the
camelCase spelling on the strength of "no spec-compliant producer can emit this key",
which is a claim about authoring, not about serving. This restores the other half, the
same way objectui#6837 restored it for `reference_to`.

**How the fold is derived.** By the spec's own alias-probe rule — lowercase, strip `_`,
`-` and space — matched exactly against `FieldSchema`'s declared key set, read at runtime
off `FieldSchema.shape`. Not a hand-written table: a table has to be edited every time the
spec grows a camel key whose snake twin is still in stored documents, and the edit that
does not happen is the bug.

**What it deliberately does not do.** It never removes a key or a value — the legacy
spelling stays on the document exactly as served, because dropping it would make a stored
legacy document lose the value instead of arriving canonical. It never overwrites a
canonical key the producer already set. It folds nothing onto a probe two declared keys
share. And it does not "correct" anything: a key that probes onto no declared key is left
alone, so a typo (`sortible`) stays a typo and `id_field` — which has no declared
successor — stays as it is.

**Not covered.** `id_field` and `title_format` are not folded — `id_field` has no declared
successor and `title_format` is out of scope pending a separate maintainer ruling. Both land
in the leave arm by the same rule, with no special case. What still waits on a
`@objectstack/spec` release carrying the `FIELD_KEY_GUIDANCE.id_field` row is the
**successor guidance** for `id_field`, which no published version carries; the leave arm
itself is no longer silent (objectui#8938 — the diagnostic states what it measured against
the linked spec rather than quoting a copy of contract prose).
