---
'@object-ui/plugin-form': patch
---

The flat `ObjectForm`'s file-size hint now reads the spec's `maxSize` (objectui#12156).

A `file` or `image` field that declares a size limit gets "Max size: …" appended to its description. The form read the limit as `max_size`, a spelling the spec's `FieldSchema` refuses by name, so metadata the server serves never carried it and the hint never appeared. It now reads `maxSize`, the spelling the file and image widgets already enforce, and no longer reads `max_size`.
