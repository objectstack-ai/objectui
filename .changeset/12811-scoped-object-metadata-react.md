---
'@object-ui/react': minor
---

feat(react): `MetadataContextValue.readObjectScope`, the object definitions one app reads (objectui#12811)

A new optional member of the metadata context. `readObjectScope({ packageId, names })` answers the
objects of one package, read with `GET /api/v1/meta/object?package=ID`, plus each of `names` that the
package does not hold, read by name. Each definition is shaped exactly as the same object in
`objects`. The answer carries `objects`, `served` (the same definitions as the server served them,
before views are merged, as `getItemsByType('object')` holds the whole list), `missing` (the names the
server answered without a definition) and `settled` (the package list and every name have answered). With no `packageId` it is
the whole registry, as `objects` is.

`objects` is unchanged: it is the whole registry. A context value without the member (a hand-rolled
one in a test, an older host) has nothing narrower to offer, and its readers read `objects`.
