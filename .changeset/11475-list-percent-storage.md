---
'@object-ui/plugin-list': patch
---

The gallery card's field bag now carries the field's `max`, the storage
statement the percent cell reads through the spec's `percentScaleOf`
(objectui#11475). Without it, a whole-stored `50` (`max: 100`) would read
`5000%` on a card beside `50%` in the grid.
