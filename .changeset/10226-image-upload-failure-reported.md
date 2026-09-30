---
'@object-ui/fields': patch
---

fix(fields): a failed image upload is reported in `ImageField`, not swallowed

Both upload paths of `ImageField` — the native picker and the crop dialog's
confirm — ran the upload inside `try … finally` with no `catch`. Both are
invoked fire-and-forget (React ignores the promise an `onChange` handler returns,
and the cropper does not await `onConfirm`), so a rejected upload (a network
error, a 413, a storage outage) showed the user nothing and escaped as an
unhandled promise rejection.

A failed upload now renders the same translated `fields.file.uploadFailed`
message `FileField` shows for the same failure, in the widget's existing error
row. The failed image is not added: on the picker path the other picks of a
multi-select still upload and land, as in `FileField`; on the crop path the
original image stays and the dialog closes so the message is visible.
