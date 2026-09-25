---
'@object-ui/plugin-form': patch
---

fix(plugin-form): `DrawerForm` no longer paints an editable form before the record it edits has loaded

Opening an edit drawer showed the form empty and editable while the record read
was still in flight, and when the record arrived it replaced whatever had been
typed there — the value was gone from the screen and from the save, with no
warning. The drawer already refused this when switching from one record to
another; it now refuses it on the first load too, keeping its loading state
until the record read lands.

`DrawerForm` builds its fields and reads its record in two effects that both run
when the object schema arrives. The field-building effect used to end the
loading state unconditionally; it now leaves that to the record read whenever
one is outstanding.
