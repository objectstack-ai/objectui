---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): a related list's row fetch drops a column the principal cannot read once the permission answer has loaded

`RelatedList`'s auto-fetch sent no `$select`, so every field of every child row
was requested and a field that field-level security denies was dropped only at
the column layer, after its value had already crossed the wire. A list with
authored `columns` now sends a `$select` built from the authored columns that
pass the same redaction, parent-key and FLS gates the column layer applies (one
shared spelling of each), plus `id`, the `$expand` roots, and, once the child
schema has loaded, the fields its row predicates read (the child object's
`userActions` Edit/Delete overrides, its actions and the host's row actions),
plus the mobile card gallery's cover field when the child declares it and FLS
allows it.
FLS drops a denied column once the permission answer has loaded; a request sent
before it can still carry that column, the same deferral `ObjectGrid` has. That
is the projection shape `ListView` and `ObjectGrid` already send (objectui#6898,
objectui#3501).

Graded as defence in depth: ObjectStack's server already strips denied fields
from every returned row (`FieldMasker`), so nothing leaked from that backend. The
projection matters for a backend that does not strip.

An authored list whose every column is denied now asks for `id` (plus predicate
operands) rather than reading the emptied column list as "no restriction".

Unchanged: a list that derives its columns, with no authored `columns` or with
redaction emptying them, still sends no projection. Its columns come from
`highlightFields` or the field walk, and both are chosen by the emptiness of the
rows fetched, so they are not known before the fetch.

Behaviour to know about on the authored path: on a backend that honours
`$select`, rows now carry only the projected fields. A row action that reads a
row field through something other than a `visible` / `disabled` predicate or
`recordIdField`, such as a `defaultFromRow` parameter or a `{field}` token in its
URL, only gets that field if the projection already carries it (a column, `id`,
or another predicate's operand). `ListView` and `ObjectGrid` already behave this
way.
