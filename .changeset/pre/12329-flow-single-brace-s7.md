---
'@object-ui/app-shell': minor
---

Studio's flow designer and Debug run stop offering and emulating the single-brace `{var}` dialect, which `@objectstack/spec` 18 deletes (objectui#12329, ADR-0032 Decision 3).

- **The reference picker has two spellings left.** It inserts the bare reference in an expression field and a `{{ x }}` hole in a text slot (a notify title or message, a screen title, an http URL). Every other text field (an output or item variable name, a notify topic, a connector action's input values, a legacy action's parameters) is a literal: it has no picker, and a `{…}` in it is not read as a reference. Before, these fields offered a picker that inserted `{x}`, which no flow reads any more.
- **A body-less loop's Collection takes the bare name of a list variable.** That is the legacy loop form, and its executor reads the name as written. The picker inserts the bare name, and a stored `{leadList}` is flagged with `leadList` as the fix. A loop with a body region keeps the literal / CEL-expression control from objectui#12372.
- **A served node descriptor's `xExpression: 'template'` mark now renders a plain text field.** The installed spec publishes that mark nowhere; it marks a loop's and a map's collection `'value'`, and the spec's ledger renders that slot.
- **The Debug run evaluates what the engine evaluates.** An assignment value that spells a `{…}` token, in the map, the legacy array or the bare-config shape, fails the node before any variable is set, with the spec's own refusal. Every other value is written as it is. A loop with a body region resolves its collection the way its executor does: a CEL value envelope is evaluated and an inline array is used as written, while a `{…}` token, a bare variable name, or a value that is not a list fails the node. A body-less loop reads its collection as a variable name exactly as written, so `{leadList}` binds nothing. The Debug run's note that named an unmodelled `{…}` token is removed, because no token is kept any more.

Nothing is added to or removed from the package entry: no export, prop or type member. The changed strings are in the metadata-admin designer's own string tables: two Debug-run notes are removed (en and zh), and one is added for a loop whose collection is not a list.
