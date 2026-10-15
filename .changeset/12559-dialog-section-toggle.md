---
'@object-ui/components': patch
---

A form field whose widget is still loading no longer takes its host off screen (objectui#12559).

The field widgets `@object-ui/fields` registers load on demand: a type's code is fetched the first time a form draws it. The form renderer drew such a widget with no loading boundary of its own, so the wait landed on the host's nearest one. In the console's record create and edit dialog that is the boundary around the whole console, because the dialog mounts beside the pages rather than inside one. Opening a collapsed section whose fields used a type not loaded yet, for example a currency or address field, swapped the whole console, dialog included, for the loading screen until the code arrived. The full-page form hid only its page.

Each registered field widget now waits in its own slot: while its code loads, the field shows a placeholder the height of a control, and the section opens in place with everything typed elsewhere in the form kept. Nothing is added to the package entry: no export, prop or type member.
