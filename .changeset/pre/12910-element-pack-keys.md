---
'@object-ui/i18n': patch
---

All ten language packs gain the keys the `element:*` blocks in `@object-ui/components` now read for their defaults (objectui#12910): `element.number.sourceUnresolved`, `element.image.noSource`, `element.recordPicker.sourceUnresolved`, and the `element.metadataViewer.*` block for `element:metadata_viewer`. No existing key or value changes.

Clause-②: yes

The new keys widen the exported `TranslationKeys`. Nothing narrows.
