---
'@object-ui/app-shell': minor
---

Studio stops inserting or prescribing the single-brace `{var}` token in the rest of the flow value slots `@objectstack/spec` 18 refuses it in (objectui#12372, ADR-0032 Decisions 2 and 3).

- **A field whose whole value is one value slot writes a literal or a CEL value envelope.** The map node's Collection (and a loop node's, while the loop has a body region), the notify node's Link record id, the http node's Body and, online, the screen node's Record to edit now have a text / expression toggle, as the value maps already do. A text value is a literal with no reference picker; JSON that spells an object or a list is stored as that value, so an http body or an inline list of items is written as data. An expression is stored as `{ dialect: 'cel', source }`, and its picker inserts the bare reference. A stored `{token}` shows spec 18's refusal, which names its CEL spelling. Which fields get the control is read from the spec's expression ledger, so a served descriptor field gets it too. A body-less loop keeps its former control: the spec reads its collection as a bare variable name and does not judge it.
- **A CRUD filter is a value map.** In the update, delete and get record nodes' Filter, each value is a literal or a CEL expression, and the text cell has no picker. A value is judged by the spec's filter-operand rule, so a query placeholder such as `{today}` is accepted and a flow token such as `{recordId}` shows its CEL spelling.
- **Help text and placeholders no longer teach `{var}`** at these fields (en and zh): the collection placeholders read `leadList` / `items`, and the update record filter's example is written as an expression.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The changed strings are in the metadata-admin designer's own string tables.
