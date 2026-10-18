---
'@object-ui/plugin-grid': patch
---

**Import Wizard preview: with *Keep unknown option values* ticked, an unknown option value on a writable field is no longer marked** (objectui#11970). The server now keeps such a value on every writable field: its import coercion keeps it, and the engine's option check admits exactly the values that import kept, on that import's writes, dry run included (objectstack#22183, in the installed `@objectstack/*` release). The preview used to spare only match-only fields, so it marked a row the server imports, and the import button's row count left that row out.

- **What changes.** With the box ticked, the preview takes every unknown `select` / `radio` / `multiselect` value, on a writable field and a match-only one alike, and the row counts on the import button.
- **What does not change.** With the box unticked, an unknown option value is marked as before, on every field. A bad cell of any other type is still marked with the box ticked. The field's options are not changed by the import.
