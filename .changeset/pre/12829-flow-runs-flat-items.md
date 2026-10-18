---
---

Console Flow Runs page: the flow list reads the served flat `meta.getItems('flow')` item only (`name` and `label` on the item itself), and the page's test fixtures feed that shape. The removed `spec`-wrapped arm had no producer: no server serves that shape, so no behaviour a user can reach changes and nothing is released (objectui#12829).
