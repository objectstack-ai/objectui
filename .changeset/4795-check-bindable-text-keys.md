---
'@object-ui/cli': minor
---

feat(cli): `objectui check` refuses a `${…}` on a text key its node never evaluates

`SchemaRenderer` evaluates an expression on the closed text keys `title`,
`label`, `value` and `description` only where `@objectstack/spec`'s
`expressionBindableTextKeysFor(type)` lists that key for the node's type.
Anywhere else the expression is never resolved, so the user sees
`${data.total}` as literal text, or nothing at all — and no step before the
browser said so.

`objectui check` now refuses such an expression in every file it recognises as
an ObjectUI schema, and the run exits non-zero. The refusal names the key, the
path to it (spelled as `objectui validate` spells paths), the keys that type
does evaluate, and the channels `SchemaRenderer` evaluates. Types with no row in
the carriage map are refused too: `text.value` and `action:button.label` are
never evaluated.

- **Component nodes only**: the file's root node and every node its `children`
  hold. Objects under other keys, such as a form's `fields` entries, are
  definitions rather than nodes and are not judged. A root of type `page` keeps
  its own `title`, which is a page key; its `children` are still judged.
- **The type is matched as written**, as the runtime matches it: `ui:card` has
  no row, and is not read as `card`.
- **A type no registered component answers to** gets a warning instead of a
  refusal, because a custom renderer may evaluate its own keys.
- **There is no escape spelling**: a `${…}` meant as literal text on one of
  these keys, such as a code sample in a `code-editor`'s `value`, is refused
  too. Write it without `${`.

The key vocabulary and the per-type carriage map are read from
`@objectstack/spec`, now a declared dependency of `@object-ui/cli`, so a row
added upstream moves this check and the runtime together.
