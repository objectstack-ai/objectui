---
'@object-ui/app-shell': patch
---

The action editor's Icon field is named by its label (objectui#12510). Its icon picker is a combobox, which takes no name from its content, and the "Icon" label beside it was bound to nothing, so a screen reader announced an unnamed combobox in the Studio's object actions and in Setup's action designer. The label now names the picker, as it already did on the object and app-navigation icon fields. Nothing changes on screen.
