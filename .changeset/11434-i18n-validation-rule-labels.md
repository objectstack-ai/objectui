---
'@object-ui/i18n': patch
---

The ten locale packs drop `appDesigner.fieldDesigner.validationRules` ("Validation Rules") and `appDesigner.fieldDesigner.addRule` ("Add Rule") (objectui#11434).

Both labelled an editor for `DesignerFieldDefinition.validationRules` that was never built: no component asked for either key, and `@object-ui/types` retires that member on both faces in this release. A host that looked either key up itself now gets the key back instead of a label; author its own label if it needs one.
