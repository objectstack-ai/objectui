---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

Studio's page-create seed and slotted page preview now build an object's default record page with the same detail sections the running app uses. On an object that declares no `fieldGroups`, both used to produce a bare `record:details`, which draws only the object's `highlightFields` (or nothing), while the running app drew every visible field split into a primary section and a collapsible "More details" section. The seed persists those sections as field names, the shape `@objectstack/spec` declares. Objects that declare `fieldGroups` are unchanged. `resolveDetailSections`' doc no longer claims a bare `record:details` falls back to a flat layout of every field.
