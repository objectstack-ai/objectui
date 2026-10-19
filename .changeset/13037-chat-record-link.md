---
'@object-ui/plugin-chatbot': patch
---

A record link in an assistant answer opens that record inside the console (objectui#13037).

An answer names a record with one fixed link form, `/record/OBJECT/ID`, for example `[Wayne Enterprises](/record/account/acc_42)`. The href must match `^\/record\/([a-z_][a-z0-9_]*)\/([A-Za-z0-9_-]{1,128})$` exactly: the object name in the spec's object-name grammar and a record id of letters, digits, `_` or `-`. A click hands the object and the id to the chat's `onOpenRecord`, the opener the `open_record` card already uses, so the console resolves the app and its own mount and navigates in the same tab, with no link dialog.

Nothing else about links changes. An external link, any other same-origin path, and a record form carrying a query string, a fragment or more path keep streamdown's link-safety dialog and new tab, and so does the record form in a chat whose host gives no `onOpenRecord`. Nothing is added to the package entry.
