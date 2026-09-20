---
'@object-ui/app-shell': minor
---

Warn at typing time when a record-scope CEL predicate is rooted on `data`.

`@objectstack/formula`'s scope vocabulary still accepts `data`, so a
`visibleWhen` / `readonlyWhen` / `requiredWhen`, a formula `expression` or a
conditional-formatting `condition` written as `data.status == 'x'` used to lint
green and then fault at runtime with `Unknown variable: data`, because the row
is bound as `record.*` and nothing else (objectui#5741, objectui#8166). The
metadata editors now surface `@object-ui/core`'s `detectNonCanonicalRowSpelling`
as an inline warning naming `record` as the fix.

The accepted set is unchanged: this is advisory only, so it does not block save
and does not mark the field invalid. It applies to `scope: 'record'` authoring
sites only — flattened RLS `USING` / `CHECK` predicates, where a bare field
reference is the correct spelling, are untouched, as is the metadata-editing
layer where `data` is canonical.
