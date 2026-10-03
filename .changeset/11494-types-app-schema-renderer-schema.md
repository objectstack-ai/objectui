---
'@object-ui/types': minor
---

`AppSchemaRendererNodeSchema` declares the `app-schema-renderer` node's `schema` input: it is the app document, `AppComponentSchema` itself, by reference, and optional (objectui#11494, triage ruling A). objectui#11440 left `schema` undeclared because no node delivered it; `@object-ui/layout` now delivers it, so that sentence of objectui#11440's entry no longer holds.

**Clause-②: yes** — the node's accept set changes on both faces:

- **Strict face (`StrictAnyComponentSchema`): widens.** A node carrying its app document under `schema` validates; it was refused there with `unrecognized_keys` naming `schema`. The nested document is closed like every other object on this face, so an unknown key inside it is refused by name.
- **Tolerant face (`safeValidateSchema`, which `objectui validate` runs): narrows for a malformed document.** `schema` used to pass unjudged, as every undeclared key does; it is now judged as the app document. A nested value that is not one is refused at its own path: a document without `"type": "app"` at `schema.type` (`invalid_value`), a non-object at `schema` (`invalid_type`), and `mobileNavMode` inside the document at `schema.mobileNavMode`, by the app document's own objectui#11363 refusal. No producer in objectui or objectstack authors an `app-schema-renderer` node with a nested document, so nothing in either repository is refused.

What stays the same: `basePath` and `mobileNavMode` on the node, as declared since objectui#11440 (a node without `schema`, such as the one the mobile guide teaches, still validates on both faces); the `children` / `body` refusals. The document's keys written flat on the node (`navigation`, `title`, `areas`, …) stay undeclared, so the strict face refuses them as unrecognized keys: the document has one spelling, nested.

```json
{ "type": "app-schema-renderer", "basePath": "/apps/crm", "schema": { "type": "app", "name": "crm", "navigation": [] } }
```
