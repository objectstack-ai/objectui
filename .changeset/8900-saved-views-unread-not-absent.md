---
'@object-ui/core': patch
---

The `dataSource.view` not-found panel no longer asserts that an object has no saved
views when nobody found out (objectui#8900).

`elementDataSourceViewNotFoundMessage` ended its empty-list branch with "This object has
no saved views." — a statement about the OBJECT, derived from a count that is equally
zero in two different worlds. `ObjectStackAdapter.listViews` degrades every failure
(refused, offline, malformed) to `[]` on the RESOLVED path — deliberate, shipped, and
kept — while `useElementDataSource`'s own discrimination only catches a REJECTION, a
shape that contract never produces. So a `view` read that never successfully happened
arrived at the renderer indistinguishable from a genuine absence, and the config-error
panel stated as fact something nobody had established. A host that composes
`@object-ui/react` + `@object-ui/plugin-list` without `app-shell`'s `AdapterProvider`
subscribes to no warning channel at all and sees only that sentence.

The empty branch now reads **"No saved views are known for this object. It may have
none, or they could not be read."** — the strongest claim that is true in BOTH worlds,
applying framework objectstack#13906 decision 1 option A (*a thing that could not be
READ is not a thing that is ABSENT*) at the one place the two worlds are structurally
indistinguishable.

Unchanged: the non-empty branch (`Known views: …`), the adapter's degrade-to-`[]`
contract, and the refusal to fall back to an unfiltered query for the object. Saying
more than this needs the failure FACT plumbed through from the adapter, which is
objectui#8151's surface and not this change.
