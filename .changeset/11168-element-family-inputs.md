---
'@object-ui/components': minor
---

`element:definition-list`, `element:repeater` and `action:button` publish
their inputs as the `@objectstack/spec` 17.5.0 rows declare them and as their
renderers read them (objectui#11168, slice 2). Each key was decided by
measuring it through `SchemaRenderer`, per the objectui#11111 ruling: declare
what the renderer honours, refuse or retire what it does not.

Narrowed (breaking for an author who wrote them, which the spec already
refuses):

- `element:definition-list.columns` takes the NUMBERS `1` and `2`, not the
  strings `'1'` and `'2'`. The renderer compares the number, so `columns: '2'`
  drew a single column. The page validator used to refuse `columns: 2`, the
  value the designer writes, and pass the string. It now accepts the number
  and reports the string as an invalid enum value. Write `columns: 2`.
- `element:repeater.filter` and `.sort` are published as lists of objects
  (`[{ field, operator, value }]` and `[{ field, order }]`), the only member
  kind the spec accepts.

Widened:

- `element:definition-list.items` is no longer required. An absent `items`
  renders the "No details" state, and the spec row does not require it, but
  the page validator reported `missing-required-prop` for it.
- `action:button.size` publishes `default`, `sm`, `md`, `lg` and `icon`, the
  five sizes the spec row declares. `default` and `icon` were refused by the
  page validator although the renderer draws both. `md` renders as `default`.

`element:repeater.fields` no longer describes a `label` member: the list has
no header row, so a label was never printed, and the spec refuses it. Write a
bare field name or `{ field }`.

Nothing changes at render time for a value the spec accepts.
