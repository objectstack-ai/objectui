---
'@object-ui/plugin-form': patch
---

fix(plugin-form): `ModalForm` no longer paints an editable form before the record it edits has loaded

Opening an edit modal showed the form empty and editable while the record read
was still in flight. When the record arrived it replaced whatever had been
typed, and the save that followed sent the whole record with its original
values. The value was gone from the screen and from the save, with no warning.
The modal now keeps its loading state until the record read lands, as the edit
drawer has done since objectui#10190.

`ModalForm` builds its fields and reads its record in two effects that both run
when the object schema arrives. The field-building effect used to end the
loading state unconditionally. It now leaves that to the record read whenever
one is outstanding, through the same check the drawer uses, which both
containers now share.
