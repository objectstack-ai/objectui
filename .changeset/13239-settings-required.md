---
'@object-ui/console': patch
---

Settings pages refuse to save while a visible required setting is empty (objectui#13239).

The spec declares a settings specifier's `required` as checked by the renderer and the server. The server judges only the keys a save changes, so a required setting nobody edited was never checked: on Setup → Email, with Host and From email both empty, changing only From name saved. Before sending a save, the page now checks every required setting whose `visible` expression holds, against the value being saved (the edit, or the stored value). A setting that is empty (no value, or only spaces) blocks the save: no request is sent, each such setting shows "This field is required" in place of its help text, and focus moves to the first one. `false` and `0` are values. A setting hidden by its `visible` expression is not checked. A setting locked by the environment is not checked: its control cannot be edited, and an environment lock carries the environment's value. Toggle rows now show a field error the same way the other rows do.

The server's rules are unchanged. No export, prop or language-pack key is added.
