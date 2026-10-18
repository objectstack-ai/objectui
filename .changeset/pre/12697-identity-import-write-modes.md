---
'@object-ui/app-shell': minor
---

The identity import no longer offers "Update existing (skip if no match)" (objectui#12697).

On `sys_user` the console's import wizard writes through the identity import door, `POST /api/v1/auth/admin/import-users`, which accepts the `insert` and `upsert` write modes only. The wizard still offered all three modes. Choosing "Update existing" refused the import and skipped every row.

- **One constant states the modes.** `IDENTITY_IMPORT_WRITE_MODES` in `views/identityImport.ts` names `insert` and `upsert`, beside `resolveIdentityWriteOptions`. The refusal now refuses every mode outside it, with the same message as before.
- **The console offers that same constant.** The object view hands it to the wizard as `writeModes` on the identity import branch only. Every other object keeps all three modes.
- **A saved mapping for users that writes in `update` mode** is listed disabled in the saved-mapping selector, with its mode named, instead of being applied and refused.

Clause-②: yes. One optional prop, `writeModes`, is added to `@object-ui/plugin-grid`'s exported `ImportWizardProps`. The constant is internal to this package's views and is not exported from its entry. Nothing narrows: the identity import already refused `update`, and it now refuses exactly that mode, with the same message.
