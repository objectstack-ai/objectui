---
'@object-ui/layout': minor
---

refactor(layout)!: retire the `page-header` node type key; the header node is `page:header` (objectui#10859, batch 8 phase 2c)

**BREAKING (authoring):** `registerLayout()` no longer registers `PageHeader` under `page-header` (and with it `layout:page-header`). `objectui validate` already refused a `page-header` node at `type`, and nothing in this repository authored or emitted it. objectstack's `page-header-subtitle-alias` conversion renames the key `description` → `subtitle` on both header spellings and leaves the type to objectui. A `page-header` node now renders the "Unknown component type" panel. `PageHeader` stays a named export for JSX composition.

Migration, measured against `objectui validate` (`page:header` carries its props in `properties`):

- `{ "type": "page-header", "title": T, "subtitle": S }` → `{ "type": "page:header", "properties": { "title": T, "subtitle": S } }`;
- `actions` (action ids) → `properties.actions`, the same id array;
- `icon` has no `page:header` spelling: the contract refuses `properties.icon` by name (an ADR-0087 D2 tombstone). Drop it, or compose `PageHeader` in JSX, which still takes `icon`;
- `children` (the right-hand slot) has no `page:header` spelling: the contract refuses a node-level `children` by name, and `properties.children` as an unrecognized key. Put the buttons in `properties.actions` as action ids, or compose `PageHeader` in JSX, which still renders its `children`.

`registerLayout()` now registers four keys: `layout:page:card`, `responsive-grid`, `navigation-renderer` and `app-schema-renderer`.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.

⚠️ **Dated note, 2026-10-02 — `responsive-grid` and `navigation-renderer` are retired too — objectui#11441.**
Later in this same release objectui#11441 (the maintainer's ruling, letters B / B) unregistered both, with their
`layout:` twins, so `registerLayout()` registers two keys: `layout:page:card` and `app-schema-renderer`. The rest of
this entry is kept as the reading of this change.
