---
'@object-ui/layout': minor
---

An `app-schema-renderer` node draws the app document it carries under `schema` (objectui#11494, triage ruling A).

**Breaking for a node that writes the app document's keys flat on itself** (shipped as `minor`, per this repository's version policy). `SchemaRenderer` hands every registered component the node itself as its `schema` prop, and `registerLayout()` registered `AppSchemaRenderer` directly, so the component took the node for its app document: a document nested under the node's `schema` key drew an empty shell, and only app keys written flat on the node (`navigation`, `title`, …), which no schema declares, drew. `registerLayout()` now registers the key against an adapter that hands `node.schema` to `AppSchemaRenderer`:

- `{ "type": "app-schema-renderer", "schema": { "type": "app", "name": "crm", "navigation": [ … ] } }` draws the document's branding and navigation.
- The same keys written flat on the node are no longer read. Move them under `schema`, with `"type": "app"`. No producer in objectui or objectstack authors them flat.
- A node without `schema` draws the shell with no branding and no navigation, as it did before.

Unchanged: `basePath` and `mobileNavMode` are read off the node, the registration's three declared `inputs`, and `AppSchemaRenderer` itself, whose JSX hosts pass `schema={appDocument}` directly. A node's `children` are still not rendered.
