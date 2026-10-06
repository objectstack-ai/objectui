---
'@object-ui/i18n': minor
'@object-ui/app-shell': minor
---

Object list pages are titled with the object's plural label (objectui#11696).

A list page read "Project" while the nav entry that opens it read "Projects", and the breadcrumb read "Project ▾". The object's `pluralLabel` was declared by the spec, served on every object document and carried into the client translation bundle, but no console surface resolved it.

- **`useObjectLabel().objectPluralLabel(objectDef)`** (`@object-ui/i18n`) — new member beside `objectLabel`. It returns the translated plural (`{ns}.objects.{objectName}.pluralLabel`), else the declared `objectDef.pluralLabel`, else the singular as `objectLabel` resolves it, so an object that declares no plural keeps its label. The first two steps match how `translateObject` in `@objectstack/spec` serves `pluralLabel` from `/meta`: a bundle that translates `label` but not `pluralLabel` shows the declared plural, here as on every other consumer.
- **The list page titles** read the plural: the object list (`ObjectView`'s page header) and the object's `/data` page (`ObjectDataPage`'s page header, the URL-defined data slice badged "Data").
- **The object breadcrumb** reads the plural: the object segment, its "Switch Object" entries, and the object crumbs of a record's ancestor trail. Each links to an object list, so the segment stays plural when the trail continues into a record ("Projects › Apollo").

The record page, the record drawer (including the one the `/data` page opens), and "New" actions keep the singular.
