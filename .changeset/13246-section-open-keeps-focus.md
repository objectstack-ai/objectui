---
'@object-ui/plugin-form': patch
---

Opening a collapsed form section keeps keyboard focus on its header the first time too (objectui#13246).

The first time a section opens, the widget code for its fields can still be loading. In the record dialog (`ModalForm`), that wait hid the whole dialog body, and the header the user had just pressed with it. The browser then dropped focus from the hidden header, and focus came back to the dialog itself, so the next Tab started again at the dialog's first field. The record drawer (`DrawerForm`) had no wait of its own: the same toggle hid everything under the host's nearest loading boundary, the drawer included. Later toggles were not affected, because the widget code was already loaded.

Both forms now open and close a section as a React transition. While the section's widgets load, the form stays on screen as it was. The header keeps focus, the section opens when its fields can be drawn, and the next Tab reaches the section's first field. The dialog keeps its own loading placeholder for every other wait, such as the first draw of its body after the record loads.

Nothing is added to the package entry: no export, prop or type member.
