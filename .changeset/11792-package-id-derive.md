---
'@object-ui/app-shell': patch
---

Studio's *New package* dialog fills in and checks the Package ID, and *New object* shows the object name that will be saved (objectui#11792).

- **The Package ID follows the display name.** In the create dialog, typing a display name fills the Package ID as `com.<organization>.<name>`. The organization part is the active organization's slug, which the session already holds. With no active organization it is left out, giving `com.<name>`. The object namespace keeps following the id as before. Once you edit the id yourself, it stops following the name.
- **An id the server would refuse is caught in the dialog.** *Create package* used to send any non-empty id. `Repairs Center` was sent and refused with a 400. The id field is now the same input the landing page's Duplicate form uses: it lowercases, removes unsupported characters and says so, and explains the format while the id is invalid. *Create package* stays disabled until the id passes `ManifestSchema`'s own id rule from `@objectstack/spec`, the rule `POST /api/v1/packages` checks.
- **New object previews the saved name.** The Data pillar saves a new object under its package namespace (`repair_ticket` is saved as `repairs_repair_ticket`). The *New object* dialog now shows that name under the identifier field. It uses the same rule the save uses.

Editing and viewing a package are unchanged. The app, automation and access *New* dialogs are unchanged. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
