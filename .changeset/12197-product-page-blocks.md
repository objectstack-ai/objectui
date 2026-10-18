---
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/cli': patch
'@object-ui/console': patch
---

feat(app-shell): five generic product-page blocks — `hero`, `stat`, `usage-bar`, `checklist`, `tile-grid` (objectui#12197)

Clause-②: yes

`@object-ui/app-shell` registers five product-neutral SDUI blocks for pages a product composes as metadata, each with declared `inputs` that state their defaults, and each accepting the spec's API binding as `dataSource`:

- `hero` — `title`, `subtitle?`, `meta?` (drawn with a copy-to-clipboard button), `status?`, `statusTone?` (`neutral` when omitted), `primary?` / `secondary?` (`element:button` or `action:button` nodes).
- `stat` — `label`, `value` (a number is formatted in the viewer's locale), `hint?`.
- `usage-bar` — `label`, `used`, `limit?`, `unit?`; the bar's width is `used / limit` clamped to 0–100, and an absent or `0` limit is unlimited: the amount used and no bar.
- `checklist` — `items: [{ label, done, action? }]`, `collapsedWhenDone?` (`false` when omitted; when set, the block draws nothing once every step is done).
- `tile-grid` — `items: [{ label, href, icon?, caption? }]` or a `${…}` hole naming such a list, `addTile?: { label, href }`; the console home's launcher tile, now shared with the home's apps strip, which draws as before.

`@object-ui/types` gains each block's strict arm in `AnyComponentSchema` (`HeroBlockSchema`, `StatBlockSchema`, `UsageBarBlockSchema`, `ChecklistBlockSchema`, `ChecklistBlockItemSchema`, `TileGridBlockSchema`, `TileGridBlockItemSchema`, `TileGridBlockAddTileSchema`, the union `ProductBlockComponentSchema`) and their TypeScript twins, so `objectui validate` accepts the five types. A value the bound answer may supply also accepts one whole-string `${…}` hole. The `dataSource` descriptions on the object-bound arms now name the object binding as one of `PageComponentSchema.dataSource`'s two shapes. `@object-ui/cli`'s known component types gain the five names. The console's preview gallery draws every block at `?only=product_blocks`.
