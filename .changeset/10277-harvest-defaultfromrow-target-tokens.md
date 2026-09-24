---
'@object-ui/core': patch
---

fix(core): a list's `$select` now carries the field a row action's `defaultFromRow` param seeds from and the `{field}` tokens of its `target`

`listViewPredicates` is the harvest `ListView`, `ObjectGrid` and `RelatedList`'s
authored path use to decide which fields a projected row must carry. It read an
action's `visible` / `disabled` predicates and its `recordIdField`, but not two
other row keys an action reads. On a backend that honours `$select`, a field
named only there was absent from the row, and nothing said so:

- a param with `defaultFromRow: true` bound to a field no column shows opened
  the console's param dialog blank, because the param is seeded only when the
  row has the key;
- a `{field}` token in an `api` action's `target` was filled with an empty
  string by the console's `api` handler.

For each action on the view's row, bulk and object action lists, the harvest now
also names:

- the row key a `defaultFromRow` param seeds from: its `field` when it declares
  one, its `name` otherwise. That is the precedence the param seeding reads, so
  a `teamId` param bound to `field: 'team_id'` asks for `team_id`;
- every `{field}` token in `target` whose content is a bare identifier, the
  grammar the console's `api` handler fills from the row. A dotted path, an
  expression and the runner's `${param.X}` / `${ctx.X}` tokens are not filled
  from the row that way, and are not harvested.

A param key that is not a bare identifier is dropped, as a `recordIdField` is.
Every harvested name still passes each consumer's existing gates before it
reaches `$select`: the check against the object's declared fields and the
platform columns every record carries, and field-level security on a declared
field once the permission answer has loaded.
