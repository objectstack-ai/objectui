---
'@object-ui/app-shell': patch
---

A metadata form row now shows the field's label only (objectui#13352). `SchemaForm`'s default row used to draw the field's machine key in a code chip beside the label whenever the label did not spell it, so Setup → Packages → New package read `Display name* name`. The key is now offered on demand instead, as the label's hover tooltip ("Machine name: name"), under the same rule as before: only when the label does not already spell the key, judged alike in every locale. The control's accessible name is the label alone.
