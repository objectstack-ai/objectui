---
---

Docs and pins only, no package released: every taught `action:*` node under `AGENTS.md`,
`skills/objectui/**` and `content/docs/guide/**` writes the block's props in the spec's
`properties` bag, as the `@objectstack/spec` `ComponentPropsMap` row declares them, instead of
flat on the node. The spec's `PageComponentSchema` is `.strict()` (ADR-0089 D3a) and refuses a
node-level `actionType` / `target` as mis-layered; objectui's strict authoring face refuses the
same two keys, and PR objectui#11069 moves `objectui validate` onto that face, so the taught node
had to move first. Same move for the `record:activity` example in the plugin-detail guide
(`limit` / `showCompleted`) and the page-builder skill's `object-form` example, which `objectui
validate` already refuses flat by name. The runtime reads both spellings through the
`SchemaRenderer` `properties` hoist, so no behaviour changes. The two ledgered pins that read the
quick-start's taught node move with it and keep a derived control that the pre-move flat spelling
is still refused by exactly `actionType` and `target` (objectui#11183).
