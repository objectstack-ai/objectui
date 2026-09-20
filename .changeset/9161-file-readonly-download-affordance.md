---
'@object-ui/fields': minor
'@object-ui/plugin-detail': minor
---

Give a read-only `file` field a per-file view/download affordance (objectui#9161).

A `file` field in read-only state produced no way to reach the file it holds. On the
record-detail page a multi-value field rendered the bare text `1 file`, a single value
rendered a bare filename, and the edit-state row rendered a filename beside a delete
button — the reporter's DOM reading of the field block was one `<button>` (the delete
icon) and zero anchors. Every other layer was healthy on the reporting card: the record
read returned the expanded `{id, name, size, mimeType, url}`, the signing endpoint
answered 200, fetching the signed URL answered 200 with a correct `content-disposition`,
and a cross-owner read answered 200 too. A file that uploaded successfully simply could
not be opened or downloaded from the product's own PC Console.

**What changed.** All three read faces now render, per file, its name AND a
keyboard-reachable view/download link:

- `FileCellRenderer` — the renderer a record-detail page actually resolves for `file`
  (and for `video` / `audio`, which ride the same entry) — normalises through
  `readFileValues`, the treatment `ImageCellRenderer` already applies to the same spec
  family, so an expanded value, a string URL, a CDN link and an unexpanded bare
  `sys_file` id all resolve.
- `FileField`'s `readonly` branch and its edit-state file rows draw the same affordance.

**No new endpoint, permission model, authoring switch or translation key.** The URL was
already in hand on every arm: `readFileValue` returns the expanded value's own `url`, or
derives the stable `/api/v1/storage/files/:id` endpoint from a bare id — and that
endpoint already 302-redirects to a freshly-signed short-lived URL per request. The link
text is the file name, which is the anchor's accessible name, so nothing new had to be
translated; a value carrying no name of its own still falls back to the existing
`fields.file.fileFallback`.

**Behaviour that moved, deliberately.**

- A NON-EMPTY array no longer renders only its count. `2 files` becomes the two files.
  The count survives where it is the whole truth: an array that resolves to no
  renderable file still states `0 files` through the same i18n channel (objectui#8496 /
  objectui#8441), rather than drawing the em-dash.
- A value that resolves to no URL renders as plain text, never as a dead anchor — the
  ruling objectui#8490 made for `email` / `url` / `phone`, applied to this family.
- `file` / `video` / `audio` move into `CHIP_UNFIT_RENDERER_TYPES` in `plugin-detail`.
  The `summaryFields` chip beside the record H1 hosts text, not controls (objectui#8464),
  so it now draws those kinds through `coerceToSafeValue` instead of their cell renderer.
  The chip's TEXT is unchanged — `coerceToSafeValue` reads the same `name` the renderer
  reads — and the file stays reachable one band down, in the field's own cell.
