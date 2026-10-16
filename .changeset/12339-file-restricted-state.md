---
'@object-ui/fields': minor
'@object-ui/i18n': minor
---

A file the reader may not open now renders a restricted state instead of a generic file chip (objectui#12339).

When a reader may read a record but not a file's `sys_file` metadata, the platform sends the file field's value as `{ id, metadataRefused: true }` (`FileRefusedValueSchema` in `@objectstack/spec/data`, spec `18.0.0-next.0`). `readFileValue` used to read it as an ordinary file named `File`. It now recognises the marker by the spec's closed schema and flags the view.

- **Public type widening:** `FileValueView` gains an optional `metadataRefused?: true`. It is set only for the refused marker, so existing consumers are unaffected.
- **What users see:** the `file` grid cell, the read-only `FileField` list and its edit rows, `FileCell`, `ImageField`, the `image` / `avatar` grid cell and `AvatarField` show a lock and a translated "Restricted file" label. They never attempt a thumbnail, because no MIME type was served. Where the renderer offers an open link, it still points to the id-derived download endpoint, which decides access on its own and may answer `403 FILE_DOWNLOAD_DENIED`. Normal file values render as before.
- **Submitting:** when an editable `FileField`, `FileCell` or `ImageField` re-submits the field's other values (append, remove, crop), it sends the marker back as its bare id, never as the marker object.
- **i18n:** two new keys, `fields.file.restricted` and `fields.file.restrictedHint`, in all ten locales.
