---
'@object-ui/types': minor
---

A `file` or `image` field's size limit is now `maxSize`, the one spelling the widgets read and the spec accepts (objectui#12156).

**Breaking, for TypeScript authors of `FileFieldMetadata` and `ImageFieldMetadata`.** Four members change. A fresh literal that still writes one of the old keys is now a compile error.

- `max_size` → `maxSize`, typed by reference to the spec's `FieldSchema.maxSize` (bytes). The old spelling was read by no widget, so a limit written that way was accepted and then did nothing: any file size was let through. The file and image widgets already read `maxSize`, and the spec's `FieldSchema` refuses `max_size` by name.
- `max_files` → removed, with no replacement, on both interfaces.
- `max_width` → removed, with no replacement, on `ImageFieldMetadata`.
- `max_height` → removed, with no replacement, on `ImageFieldMetadata`.

The three removed keys were read by no widget in either spelling, and `FieldSchema` declares no twin for any of them, so no file count or pixel bound was ever enforced. They are removed rather than renamed: a camelCase key that no contract declares is not added. To migrate, rename `max_size` to `maxSize` and delete the other three.

The `file` and `image` field docs pages teach `maxSize` and no longer show the three removed keys.
