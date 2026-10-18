---
'@object-ui/app-shell': minor
---

Studio writes the flow spellings `@objectstack/spec` 18 accepts (objectui#11824, ADR-0032 §3).

- **Flow text slots use `{{ }}` holes.** The notify node's Title and Message, the screen node's Title and Description, and a refusing end node's message render `{{ }}` template holes, and spec 18 refuses a single-brace `{…}` token there. In those five fields the reference picker now inserts `{{ name }}`, the placeholders and help text show `{{ }}`, and a single-brace token is flagged inline with its `{{ }}` spelling. The same holds online, where the descriptor publishes the screen's Title and Description as plain strings. Condition and expression fields keep their brace check unchanged, and every other text field keeps its current spelling.
- **The screen preview renders `{{ }}` holes.** A hole over a known variable shows its value, an unknown one stays as written, and a single-brace token is shown as written.
- **Notify recipients are value slots.** A Record field row now writes a CEL value envelope, `{ dialect: 'cel', source: 'record.FIELD' }`, where it wrote `{record.FIELD}`, which spec 18 refuses. A new Expression row writes any other CEL value envelope (a flow variable such as `ownerId`) with the bare-reference picker. Other rows are literal text. A stored single-brace recipient such as `{record.owner}` is shown under Other and kept as typed: spec 18 refuses it, and nothing rewrites it automatically, because the two dialects treat an absent field differently.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new strings are in the metadata-admin designer's own string tables (en and zh).
