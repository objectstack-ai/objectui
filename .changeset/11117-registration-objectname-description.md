---
'@object-ui/plugin-map': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-calendar': patch
---

fix(plugin-map, plugin-gantt, plugin-calendar): the `objectName` input description names the `dataSource.object` binding (objectui#11117)

The designer-facing `objectName` input on `object-map`, `object-gantt` and `object-calendar` (and
`view:calendar`, which shares the calendar's list) said the block's schema refuses a block that
declares none of `data`, `staticData` and `objectName`. Since objectui#11117 the schema also
accepts a block whose `dataSource.object` names the object, because the registration's
`ElementDataSourceGate` lands that name on `objectName` before the renderer reads the node. The
sentence now says so. No input's name, type, `required` flag or shape changed.

The `plugin-gantt` and `plugin-kanban` READMEs carry the same correction.
