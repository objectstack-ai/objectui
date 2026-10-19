---
'@object-ui/app-shell': patch
---

Studio names two more things by label where the served metadata carries one. In Explain access, each pipeline layer's "Contributed by" chips now show the position or permission set by its label (from `meta/position` and `meta/permission`), the machine name kept on the chip's tooltip, the way the Principal card's chips already read. The flow header's Trigger pill now names the object a record-triggered or time-relative flow watches by its label (for example "Record updated · Task"), from the same object catalog the Start node's object picker reads, with the object name on the tooltip. A name with no label, or a list that fails to load, still shows the machine name.
