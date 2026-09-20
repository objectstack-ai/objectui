---
'@object-ui/fields': minor
---

Give the `file` grid cell a per-file view/download affordance (objectui#9485).

`FileCell` — the compact `file` control a line-item grid row draws — rendered each
stored file as a chip of image thumbnail or file icon, the filename, and a delete
button. There was no anchor anywhere inside that chip, so an attachment on a grid row
could not be opened or downloaded. Line-item grids are where downstream projects put
per-row attachments (delivery-note lines, material certificates), so the consequence is
the one objectui#9161 already ruled on, one surface further down.

**`disabled` is the worse half.** `disabled` is this control's read-only state: it draws
no picker button and no delete button either, so the chip was *nothing but* a filename —
no route to the file existed at all.

**What changed.** The chip's bare name becomes the same shared `FileValueAffordance`
that objectui#9161 landed for the cell renderer, `FileField`'s `readonly` branch and its
edit-state rows, with `icon` suppressed because the chip already draws its own thumbnail
or file icon immediately to the left. The chip's other furniture — the thumbnail, the
file icon, the delete button while editable — is untouched.

**No new module, endpoint, authoring switch or translation key.** The shared component
was already imported into this very file by objectui#9161, and the URL was already in
hand: `readFileValues` resolves the expanded value's own `url`, or derives the stable
`/api/v1/storage/files/:id` endpoint from a bare `sys_file` id, which 302-redirects to a
freshly-signed short-lived URL per request. The link text is the file name, so it is the
anchor's accessible name and nothing new had to be translated; a value carrying no name
of its own still falls back to the existing `fields.file.fileFallback`.

**A value that resolves to no URL still renders as plain text, never as a dead anchor** —
objectui#8490's ruling for `email` / `url` / `phone` applied to this family. That case is
pinned green on both sides of this change, because it is the one the fallback exists for.

The card was filed from a source reading, with the filer stating that it had not been
reproduced in a browser. The pins added here render the cell and read its DOM in both
states, so this behaviour is measured rather than inferred.
