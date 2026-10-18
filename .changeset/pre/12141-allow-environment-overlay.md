---
'@object-ui/app-shell': minor
---

Studio and the metadata admin read a metadata type's overlay flag under its new name, `allowEnvironmentOverlay`, and the read-only banners name `OS_METADATA_WRITABLE` (objectui#12141, the objectui half of objectstack-ai/objectstack#22340 S2).

BREAKING (`@object-ui/app-shell`): the `RichMetadataTypeEntry` member `allowOrgOverride` is renamed to `allowEnvironmentOverlay`, and so is the member `resolveResourceConfig` accepts on its server entry and returns. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `allowOrgOverride` → TO `allowEnvironmentOverlay`

Why: the server renames the `GET /meta/types` field `entries[].allowOrgOverride` to `entries[].allowEnvironmentOverlay` and writes only the new name (objectstack-ai/objectstack#22340, ruled Q1 A / Q2 A). Its meaning is unchanged: may an environment overlay an item of this type that a package ships (ADR-0131 D6). There is no alias window and no dual read. Every reader in the metadata admin and Studio reads the new name only: the editor's write gates, the permission matrix, the type list's create button, the embedded item editor, the directory's "Writable only" filter and its tiles, and the page header's badge.

**Migration.** A host that reads `RichMetadataTypeEntry` or `resolveResourceConfig`'s result renames the member; its value stays the same. Run this release against a server that carries objectstack-ai/objectstack#22340 S2. Against an older server, the field this release reads is absent: every packaged item of the five overlay types (`view`, `dashboard`, `report`, `translation`, `email_template`) opens read-only, and their directory tiles drop from "writable" to "create-only".

The read-only messages now name only remedies that exist:

- **The read-only type banner** used to tell an admin to set `OBJECTSTACK_METADATA_WRITABLE` and to "flip `allowOrgOverride` in the registry". The server reads only `OS_METADATA_WRITABLE`, and the registry is a TypeScript literal in `@objectstack/spec` that no deployment edits. The banner now names `OS_METADATA_WRITABLE` and says what it opens: the type's items that no package ships, never an item a package ships. It offers no registry flip. English and Chinese both change.
- **The "writable" badge** on a type the env var elevates (directory tile and page header) names `OS_METADATA_WRITABLE` in its tooltip, with the same reach.
- **The permission matrix's "provided by a code package" hint** no longer lists the env var among its routes, since the env var does not open a set a package ships. It says so instead. "Clone to customize", redeploying the source and creating a new runtime set are unchanged. The hint for a type with no runtime write channel keeps the env var as a remedy and states its reach. English and Chinese both change.

**Clause-②: yes.** `RichMetadataTypeEntry`, exported from the package entry, loses the member `allowOrgOverride` and gains `allowEnvironmentOverlay`, with the same optional boolean type. `resolveResourceConfig`, also exported, does the same on its parameter and its return type. No other export, prop or i18n key is added or removed: the banner and hint strings live in the metadata admin's own table, and the banner drops its `{override}` placeholder.
