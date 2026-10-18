---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

Titles and links outside the object list page that name a list of an object's records read the object's plural label (objectui#11733).

objectui#11696 titled the object list page and its breadcrumb with `useObjectLabel().objectPluralLabel`: the translated plural, else the declared `pluralLabel`, else the label. The other places that name the same kind of list now read it too:

- **Related-list titles on the record page** (`RecordDetailView`): a section listing a child object's records is titled with the child's plural ("Tasks"). A child that points at the parent through more than one field is titled with its plural and that field's label ("Opportunities · Partner Project"); that title was built from the child's untranslated label before.
- **`record:related_list` and `record:reference_rail` with no authored title** (`@object-ui/plugin-detail`): the list heading, each rail card, and the rail's "+ N empty (…)" line read the bundle's `objects.{name}.pluralLabel`, else the translated label, else the humanized object name. These blocks hold the related object's name only, so they read bundle keys, not a declared `pluralLabel`.
- **The record form page's breadcrumb link** (`RecordFormPage`): the link to the object's list reads the plural; the "Create …" / "Edit …" title and the save toast keep the singular.
- **Favorites and recent items**: the favorite saved by the object list page's star button is labelled with the plural, and a recent `object` entry is named with the plural (`useRecentItemLabel`).
- **The record page's back link**: when the open list view has no label, the link back to the list reads the plural, both when a row or a link cell opens the record (`ObjectView`) and when a create lands on the new record's page.

Unchanged: an unlabelled `object` navigation entry still inherits the singular (`useNavTargetLabel`, step 3 of the spec's navigation-label rule), and record-scoped text keeps the singular: the record page, the record drawer title, "New …", "Create …" / "Edit …", the delete confirmation and toasts, and the import wizard's object name.
