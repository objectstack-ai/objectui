---
'@object-ui/fields': patch
---

fix(fields): a lookup value picked before the referenced object's schema loads is labelled from that schema once it arrives (objectui#10559)

A pick used to cache the option it was handed, with its label built at pick
time. A lookup asks for the referenced object's schema when it mounts, so a
record picked before that schema arrived was labelled on the `name` guess, and
the chip kept that label. The dropdown option for the same record read the
object's declared `nameField` once the schema arrived. So the chip read `Acme`
while its own dropdown option read `HT-001`. This held for a pick from the
dropdown, from the browse-all dialog and from quick-create.

A pick now keeps the record's row instead of the option. The chip's option is
derived from that row on every render, through the same derivation the hydrated
value uses since objectui#10487, so its label follows the schema when it
arrives. The row a dropdown pick keeps is the candidate as served, with
relations collapsed to ids, as the dropdown builds its options. The browse-all
dialog and the search-first people picker keep the rows they hand back, and
quick-create keeps the created record. No record is fetched again to relabel
it, and no remount is involved. An authored static option keeps no row: its
chip resolves from the authored `options` list, which is consulted first.
