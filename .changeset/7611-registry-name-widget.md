---
'@object-ui/fields': minor
'@object-ui/types': minor
'@object-ui/data-objectstack': minor
'@object-ui/i18n': minor
'@object-ui/components': patch
'@object-ui/app-shell': patch
'@object-ui/core': patch
'@object-ui/cli': patch
---

A record-form field can name one item of a metadata registry by its machine name: a `text` field that declares `widget: 'position-ref'` lists the position registry, and one that declares `widget: 'permission-ref'` lists the permission-set registry. It stores the name only (objectui#7611, ruling B2 on objectstack#22865). This is the mechanism the metadata forms' `ref-multi:permission` picker brought in (objectui#12126), now reachable from an ObjectQL object field. A grant table's name field (`sys_user_position`'s position, `sys_user_permission_set.permission_set`) can now offer the declared items instead of a box for a typed name.

- **The widget (`@object-ui/fields`).** `field:position-ref` and `field:permission-ref`, one key per registry type, with the type in the key, as `object-ref` carries `object`. Like every `widget` value, the name is looked up as `field:<widget>`. Each item reads as its label beside its name, and a pick writes the name: no label, no id. A stored name the loaded registry does not list stays on screen as its own option, flagged *not found*. The four catalog arms follow the metadata forms' `ref:dataset` / `ref-multi:<type>` pickers. With no data source that can list a registry, the field is a text box for the typed name. While the list loads, the stored name sits in a disabled box. When the load fails, a notice names the failure and its cause, and the text box stays enabled. A loaded but empty registry gives the same text box. Neither key is a declarable field type: both are widget hints, like `object-ref`.
- **The catalog (`@object-ui/types`, `@object-ui/data-objectstack`).** `DataSource` gains an optional `listMetadataItems(type)`, answering `{ name, label }` headers for one registry type. An empty array is authoritative ("this registry has no item of this type"), so a failed load must reject, never resolve `[]`. `ObjectStackAdapter` implements it over `GET /api/v1/meta/:type` (the client's `meta.getItems`). It rejects with the transport's error, and refuses an answer that carries no `items` list. It is uncached, so an item authored in Studio shows on the next form.
- **Locale keys (`@object-ui/i18n`).** `fields.registryRef.loadFailed` and `fields.registryRef.notFound`, in all ten packs.
- **Wiring.** The form renderer threads `dataSource` to both keys, as it does for the other widget-hint pickers (`@object-ui/components`). The inline-grid exclusion set and the action-param value-shape table list both keys as widget-hint-only (`@object-ui/fields`, `@object-ui/app-shell`). The CLI's generated `KNOWN_SCHEMA_TYPES` gains `field:position-ref` and `field:permission-ref` (`@object-ui/cli`). A comment in `@object-ui/core` stops counting the picker names.

**Clause-②: yes (widening)**: one optional `DataSource` member, two registered `field:` keys (the `RegisteredFieldWidgetType` union and `FORM_FIELD_TYPES` gain two members), and two locale keys. Nothing narrows: a field without the hint renders exactly as before.
