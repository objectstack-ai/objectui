---
'@object-ui/i18n': minor
---

Every built-in locale pack gains one key, `form.maxFileSize` (objectui#12156). It is the size-limit hint the flat `ObjectForm` appends to the description of a `file` or `image` field that declares `maxSize`. Its value takes the formatted limit through `{{size}}`; in `en` it is "Max size: {{size}}". No other key is added, renamed or removed.
