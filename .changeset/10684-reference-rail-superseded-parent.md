---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): a `record:reference_rail` block shows the related rows of the record on screen, not an earlier record's answer that arrived late (objectui#10684)

The reference rail applies its answers while it is mounted, whichever run
started the read. When the record changed while a read for the previous record
was in flight, that answer could arrive after the current record's answer and
replace its rows. It could also settle first and clear the entry's skeleton
while the current record's read was still in flight.

An answer is applied now only while the record and entries it was read for are
still the ones on screen, so a read for the previous record is dropped when it
arrives. A re-render for the same record starts no new read, so the answer in
flight still lands.
