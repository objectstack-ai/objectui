---
'@object-ui/app-shell': patch
---

The metadata form's code editor reads and writes an expression slot through
the ADR-0089 envelope (objectui#10963).

A form row `{ type: 'code', language: 'expression' }` sits over a spec slot
that persists as the `{ dialect, source, … }` envelope: a field's
`visibleWhen` / `readonlyWhen` / `requiredWhen` and a formula field's
`expression`. `CodeWidget` read the value with `String(value)`. The editor
therefore showed the literal text `[object Object]`, and the first edit wrote a
bare string over the envelope and dropped its `meta`.

For the `expression` language, `CodeWidget` now reads the editor text through
`expressionSource` and writes each edit through `writeExpressionSource`. This
is the pair `ConditionWidget` already uses, with the same write rule:

- an edit over an envelope keeps its `dialect` and `meta`, replaces `source`
  and drops the stale `ast`;
- an edit over a bare-string or empty value writes the bare string, which the
  spec normalises to `{ dialect: 'cel', source }`;
- **a cleared expression now writes `undefined`, where `CodeWidget` used to
  write `''`**. This matches `ConditionWidget`, so a cleared predicate removes
  the key instead of storing an empty expression.

The switch is the row's declared language and nothing else. Every other
language (`javascript`, `html`, `jsx`, `json`, …) keeps the string path
exactly as before, and a stored value's shape is never used to pick the path.
A row that holds an expression but declares another language is fixed in the
form that declares it. The hook form's `condition` row is one such row: it
declares `javascript` today, and objectstack-ai/objectstack#20439 carries its
fix.
