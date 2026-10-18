---
'@object-ui/app-shell': minor
---

Studio stops writing the single-brace `{var}` token in the flow fields `@objectstack/spec` 18 refuses it in (objectui#12101, ADR-0032 Decisions 2 and 3).

- **Value maps write a literal or a CEL value envelope.** In the subflow node's Input mapping, the script node's Inputs and the screen node's Form defaults, each value is a literal or a CEL value envelope, `{ dialect: 'cel', source }`. A text value is now literal text with no reference picker, because the picker could only insert a `{var}` token spec 18 refuses there. To reference a variable, switch the value to an expression; its picker inserts the bare reference. A stored `{token}` value shows spec 18's refusal, which names its CEL spelling. The help text no longer teaches `{var}`. The same applies to every other key/value map the spec marks as a value slot (the assignment node's map and a record node's field values).
- **More text slots use `{{ }}` holes.** The notify node's Click-through URL, the http node's URL and each http header value render `{{ }}` holes. Their picker now inserts `{{ name }}`, and a single-brace token is flagged inline with its `{{ }}` spelling. The same holds online, where the descriptor publishes these fields with no dialect marker.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The changed strings are in the metadata-admin designer's own string tables (en and zh).
