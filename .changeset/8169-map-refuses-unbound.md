---
'@object-ui/plugin-map': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-view': minor
---

An unbound map now REFUSES; coordinates are never guessed (objectui#8169, maintainer
ruling 2026-09-07, decision batch #67, option B).

**Behaviour change, deliberately, with no staged window.** A map with no coordinate
binding renders

> Map configuration required — declare `map.locationField` or `map.latitudeField` + `map.longitudeField`

in place of the map, instead of painting an empty one. The principle behind
objectui#7070 (date axes are never invented) and objectui#5953 (a marker title is never
forged) now covers coordinates as well: bindings are never fabricated, and an unbound
surface refuses.

Three things moved together, because moving any one of them alone makes the tree worse:

- `@object-ui/plugin-map` — `getMapConfig` loses its default branch, the one that
  returned the field names `latitude` / `longitude` / `location` / `description` when
  the author declared nothing, and `ObjectMap` gains the refusal state above. The
  refusal covers every branch, so a declared block that binds no coordinate field
  (`map: { titleField: 'name' }`) and a half pair (`latitudeField` with no
  `longitudeField`) refuse too — those used to render an empty map under the
  excluded-records notice.
- `@object-ui/plugin-list` and `@object-ui/plugin-view` — the `locationField: … ||
  'location'` floor each flattener added on the way into the map is deleted. The
  flattened schema now carries exactly what the view declared.

⚠️ **Deleting the relay floors alone would have widened the guess, not closed it** —
measured on the card. The floor forced `getMapConfig`'s flat branch, which returns
`locationField` and no `latitudeField` / `longitudeField`, so dropping it on its own
would have handed undeclared views the component's three-name default branch instead of
one name, and records carrying real `latitude` / `longitude` columns would have *started*
plotting on views that declared nothing.

**Migration.** Declare the binding on any map view that relied on the old defaults:
`map: { locationField: 'your_field' }`, or `map: { latitudeField, longitudeField }`. A
record set carrying `latitude` / `longitude` (or `location`) columns no longer plots on a
view that declared no map block — it shows the refusal, which names what to write.
Interface pages are unaffected where the object actually has a location-typed field:
`defaultMapFromObject` derives `locationField` from the object's own field list, which is
a reading of declared metadata rather than a guess, and is unchanged.
