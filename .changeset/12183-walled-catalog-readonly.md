---
'@object-ui/app-shell': patch
---

Under a tenancy wall (`isolated` or `group`), the security catalog's pages are read-only for everyone but the platform operator, and say why (objectui#12183).

objectstack ADR-0131 D3 makes the security catalog (positions, permission sets, capabilities) the platform operator's on a walled deployment. Since objectstack#22895, every door that writes one of those items refuses any other caller with 403, `manage_metadata` included: the `/meta` save, reset, publish and rollback doors, the data door on the catalog objects, the clone door, and the activation door. A tenant administrator holding `manage_metadata` was still offered all of those writes.

The console now reads the two facts the server publishes for that verdict: the deployment's posture (`features.tenancyPosture`) and the caller's platform-operator rung (`user.isPlatformAdmin` on the session). For a walled tenant:

- **The catalog list** offers no New and no live active switch, and states the rule.
- **The position and capability editors** offer no Edit or Save, and their create page no Save. They state the rule instead of the missing-capability notice, since the capability does not admit a tenant there.
- **The permission-set editor** offers no Save, locks every grant, and offers no "Clone to customize". Its read-only badge names the operator.

Assigning holders stays writable: the server never judges an assignment. The operator keeps every write. `single`, an unknown posture and every other metadata type are unchanged. The gate does not read the Setup scope, because the server refuses a package-door draft of a catalog item the same way.

The metadata editor's designer also opens in design mode only for a caller who can save. A caller without `manage_metadata` used to land in design mode with no Save.

Nothing is added to the package entry: no export, prop or type member. One designer-table string is added, `perm.readOnly.walled`, in English and Chinese; no language-pack key is added.
