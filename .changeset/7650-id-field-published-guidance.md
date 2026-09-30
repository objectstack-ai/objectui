---
'@object-ui/core': patch
---

The ingestion choke point's diagnostic for a stored `id_field` now carries the reason
`@objectstack/spec` publishes for that key (objectui#7650).

`FieldSchema` declares no successor for `id_field`, so `normalizeSchemaReferenceKeys`
leaves the key exactly as served and, in dev, says it cannot canonicalize it (the
`no-declared-twin` diagnostic). That line now also carries `FIELD_KEY_GUIDANCE.id_field.why`,
read from the installed `@objectstack/spec/data`: the spec's own sentence on why the key has
no successor and what to author instead. objectui keeps no copy of that sentence, and the
read has no fallback: on a spec without the row, the dev-mode diagnostic throws instead of
printing less. Production never reads the row.

Nothing else moves. `id_field` is still never folded and no `idField` is read; a typo such as
`sortible` still gets no suggestion; no accepted document, published type or served value
changes. No floor raise: `@object-ui/core` already declares `@objectstack/spec ^17.5.0`, and
17.5.0 is the first published release carrying the row (17.4.0 has none).

The line's closing clause is corrected for every refusal: it said the value "reaches no reader",
which is false where a retired spelling is still read on purpose (`resolveActionParam` reads
`id_field`), and it now says that a consumer reading only the spellings `FieldSchema` declares
will not see the value.
