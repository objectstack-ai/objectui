---
'@object-ui/app-shell': patch
---

A comment edit on the record feed sends only the new text and its mentions (objectui#12314, the objectui half of ruling A on objectstack-ai/objectstack#23124). The console used to write `is_edited: true` and a client-clock `edited_at` with every edit. The platform now stamps both fields itself when a comment's body changes, and both are read-only to data entry, so a server on the 18 line dropped the console's copies and logged a warning on every edit.

The row's "edited" mark after a save is read from the stored record the update answers with, the same `is_edited` field the next read shows it from. A server that stamps nothing (a `@objectstack/plugin-audit` release before the stamp) answers an unstamped row, and the edited comment shows no mark until a release that stamps it.

Nothing is added to or removed from the package entry.
