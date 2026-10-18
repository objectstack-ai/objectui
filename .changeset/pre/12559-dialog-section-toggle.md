---
'@object-ui/plugin-form': patch
---

Opening a collapsed section in a record dialog no longer takes the whole console off screen (objectui#12559).

The field widgets `@object-ui/fields` registers load on demand: a type's code is fetched the first time a form draws it. Nothing inside the modal form caught that wait, so it landed on the host's nearest loading boundary. In the console's record create and edit dialog that is the boundary around the whole console, because the dialog mounts beside the pages rather than inside one. Opening a collapsed section whose fields used a type not loaded yet, for example a currency or address field, swapped the whole console, dialog included, for the loading screen until the code arrived. The full-page form hid only its page.

The modal form now owns that wait: the dialog keeps its header and footer, its body shows a placeholder until the widget's code arrives, and the form underneath keeps its state, so the section the user opened is open and everything typed elsewhere is kept. Nothing is added to the package entry: no export, prop or type member.
