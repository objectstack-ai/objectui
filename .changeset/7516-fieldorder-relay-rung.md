---
'@object-ui/app-shell': patch
---

fix(app-shell): a list view's own `fieldOrder` now reaches the list

A `fieldOrder` authored on a per-list-view entry (`listViews.VIEW_NAME.fieldOrder`)
was accepted and served, then silently dropped: `ObjectView`'s `renderListView`
relay carried the view's `hiddenFields` onto the schema it hands `ListView` but
had no rung for `fieldOrder`, so the list could only ever be ordered by a
`fieldOrder` already on the host's list schema. It is relayed now, beside
`hiddenFields` and with the same precedence: the view's value wins, and a view
that authors none keeps the list's own.

`ListView` composes it exactly as it always has — `columns` projects,
`hiddenFields` subtracts, `fieldOrder` sorts what survives, and a surviving
column it does not list sorts last in its `columns` order — the composition
objectstack#15184 wrote into the protocol.
