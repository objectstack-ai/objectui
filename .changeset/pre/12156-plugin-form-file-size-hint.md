---
'@object-ui/plugin-form': patch
---

The flat `ObjectForm`'s file-size hint now reads the spec's `maxSize`, and it is shown in the session language (objectui#12156).

A `file` or `image` field that declares a size limit gets a size-limit hint appended to its description. The form read the limit as `max_size`, a spelling the spec's `FieldSchema` refuses by name, so metadata the server serves never carried it and the hint never appeared. It now reads `maxSize`, the spelling the file and image widgets already enforce, and no longer reads `max_size`.

The hint's words were an English literal ("Max size: …"). Once the hint started to appear, a session in any other language would have shown that English beside a translated form. The words now come from the `form.maxFileSize` pack key in the session language. The number and unit are still formatted the same way ("10.0 MB"). A host with no i18n provider still sees the English sentence.
