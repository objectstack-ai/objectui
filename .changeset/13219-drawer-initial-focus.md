---
'@object-ui/plugin-form': patch
---

Record drawers open on their first field (objectui#13219), as record dialogs do since objectui#13130.

`DrawerForm`'s panel opened with focus on its Close button (the master-detail drawer on its Cancel button), never on a field. The object schema, and on edit the record, are read after the drawer opens, so when the drawer took focus no field was there yet. While the body loads, the drawer now keeps focus on its own panel. When the fields arrive, focus moves to the first field that can be edited, skipping disabled and read-only ones. If the user has already moved focus to another control, focus stays there. This covers both of the drawer's bodies: the form and the master-detail form.

No export, prop or schema key is added.
