---
"@object-ui/plugin-detail": minor
---

fix(plugin-detail): `record:details` field security now fails closed on an entry it cannot name

`filterList` filters `fields` and `sections[].fields` against the allow-list
built from `enforceFieldSecurity` / `redactFields`. Its else-branch KEPT any
entry whose identity it could not resolve, and its identity reader is
`columnIdentity` alone — so every entry that is not a bare string, `{ field }`,
`{ name }` or `{ fieldName }` escaped BOTH controls. A field-security control
defaulting to *permit* on the one input it could not understand is the worst
available default for a control; the entry is now excluded instead.

This is the same one-arm repair objectui#8793 made on `record:related_list`'s
fold, deliberately identical: one defect on two paths gets one shape.

**Measured, and narrower than its sibling.** No record VALUE was reaching the
screen through the kept entry. `RelatedList` resolves a column as
`accessorKey || columnIdentity(c)`, a second read point that could name what
the fold could not — that is what made objectui#8793 a data leak.
`DetailSection` renders from `field.name` only, so the kept entry painted a
labelless "no value" placeholder row and never a value. What is closed here is
the fail-open default, not a measured exposure.

**Behaviour change, deliberately narrowing.** On a detail block that switches
the filter on, an entry resolving to none of `field` / `name` / `fieldName`
stops rendering — including one authored purely in the table library's
`accessorKey` spelling, and including the case where the redacted or denied
field is some other entry entirely. What disappears is the placeholder row that
entry already rendered, never a value. Blocks that set neither key are
untouched: the fold does not run there and the list is handed down by
reference. The spec-declared spelling for these keys is a field-name string,
which resolves and is unaffected.
