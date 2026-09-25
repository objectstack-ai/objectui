---
'@object-ui/plugin-timeline': minor
'@object-ui/plugin-list': minor
---

Retire the undeclared timeline `metaFields` reads in both packages (objectui#10222).

The spec's `TimelineConfigSchema` is a strict object that declares no `metaFields` member and
refuses one, yet `ObjectTimeline` read it (through an `as any` cast) to pick the chip fields
beside each title, and `ListView` read it three times: two field collectors put the listed
fields into `$expand` / `$select`, and the status / priority auto-projection was skipped when
the list was present. All four reads are deleted.

**Behaviour change:** a stored interface-page view carrying `options.timeline.metaFields` falls
back to the default card labels (the built-in `status` / `priority` chips, limited to the fields
the object declares), and the fields that list named are no longer fetched for it. No such view
has been found; the stored rows are not censused. A timeline without the key renders and fetches
exactly what it did before, because `ListView` now projects `status` / `priority` for every
timeline view.

`cardFields` stays the reserved spelling if authored timeline chip fields are ever asked for;
nothing is declared.
