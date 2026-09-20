---
---

Pin the four `object-metric` members that shape the aggregate query behind the
number — `dataSource`, `aggregate`, `filter`, `compareTo` (objectui#8071, slice
8). `MEMBER_PIN_EXEMPTIONS` drops 37 → 33 and `MEMBER_PIN_EXEMPTION_CEILING`
follows in the same commit; `trend` and `drillDown`, which shape what is drawn
around the number rather than the number, stay exempt.

Test only; no package is released by this change.
