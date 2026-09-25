---
'@object-ui/fields': patch
---

fix(fields): an image, avatar or signature cell holding a `data:` URI no longer names its image with the base64 payload (objectui#10493)

`readFileValue` took the text after a URL's last `/` as the file's display name. A `data:` URI
has no path, so a `data:image/png;base64,…` value was named `png;base64,…` (or a fragment of the
payload, when the base64 holds a `/`). The image cell uses a value's name as its `<img>` alt, and
`SignatureField` stores `canvas.toDataURL('image/png')`, so every populated signature cell had
kilobytes of base64 as its alt, which a screen reader reads aloud.

A `data:` URI now carries no display name, so `readFileValue` answers the caller's fallback name
for it, as a string value and as the `url` of an object value. The image cell (registered for
`image`, `avatar` and `signature`) now reads its images with no fallback name, so a value that
carries no name of its own gets the translated `fields.image.imageAlt` alt ("Image 1", numbered by
position) and the lightbox it opens gets the translated alt and title. Before this, such a value
was named with the untranslated literal `Image` on every locale. That applied to a bare `sys_file`
id too, which now also gets the translated alt.

What an author or reader sees change: the alt of a data-URI or bare-id thumbnail in a read-mode
cell, and the file cell's link text for a data-URI value, which is now the translated file
fallback. Stored values do not change: the `data:` URI is still the `<img>` `src` byte for byte.
A value that carries a name keeps it, whether from `name` / `original_name` or from an `https` or
`blob:` URL's last segment.
