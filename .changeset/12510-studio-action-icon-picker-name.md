---
'@object-ui/app-shell': patch
---

Two Studio pickers are named by the labels shown beside them (objectui#12510). Nothing changes on screen.

- **The action editor's Icon field.** Its icon picker is a combobox, which takes no name from its content, and the "Icon" label beside it was bound to nothing, so a screen reader announced an unnamed combobox in the Studio's object actions and in Setup's action designer. The label now names the picker, as it already did on the object and app-navigation icon fields.
- **The Explain access sheet's User picker.** The picker was named by the principal it shows alone ("Me (calling principal)"), and the "User" label above it was bound to nothing. The label now names it, followed by the principal: "User Me (calling principal)", or "User" and the picked person's name.
