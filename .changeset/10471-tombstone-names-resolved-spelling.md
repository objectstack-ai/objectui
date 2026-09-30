---
'@object-ui/fields': patch
---

The retired-field tombstone now names the spelling it was resolved under, not
the live `type` of the field it is handed (objectui#10471).

A retired spelling can reach the tombstone through an authored `widget`, which
wins over `type` in both form hosts. A field such as
`{ type: 'user', widget: 'owner' }` was therefore answered by the `owner`
tombstone, but the tombstone re-derived its spelling from the field and said
"Field type `user` was retired": it named a LIVE type as retired, dropped the
migration prescription for `owner`, and logged nothing to the console.

`getLazyFieldWidget` and the `field:` registrations made by
`registerAllFields()` now hand out a tombstone bound to the retired key they
resolved, one component per spelling. `RetiredFieldTombstone` reads a new
optional `retiredFieldType` prop first and falls back to the field's `type` only
when it is absent, so a host that renders it directly with a field whose `type`
is the retired spelling behaves as before.

The retired-type table itself is unchanged. The registry entry under
`field:owner` is now the bound tombstone rather than `RetiredFieldTombstone`
itself, so code that compared the registry entry by identity against
`RetiredFieldTombstone` should compare what it renders instead.
