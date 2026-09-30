---
'@object-ui/fields': patch
---

fix(fields): the image field widget names an image that carries no name of its own with the translated `fields.image.imageAlt`, not the literal `Image` (objectui#10637)

`ImageField` read its images with the untranslated literal `'Image'` as the fallback name, so a
value with no name of its own (a bare `sys_file` id, or a `data:` URI) was named `Image` on every
locale. Its `<img>` alt, the read-mode enlarge button's accessible name and the lightbox it opens
all read that word, and the translated `fields.image.imageAlt` fallback never ran.

`ImageField` now reads its images with no fallback name, as the image cell has since
objectui#10493. A nameless image gets the translated alt ("Image 1" in `en`, numbered by
position) in read mode and edit mode, the enlarge button's name embeds that alt, and the lightbox
gets the translated alt and the translated preview title. A value that carries a name keeps it.
The cropper's output file name for a nameless image is now the widget's own fallback
(`image-0.png` for the first image), where it was `Image`. Stored values do not change.
