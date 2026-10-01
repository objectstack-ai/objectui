---
'@object-ui/types': minor
---

A bind-only `list` is accepted: `ListSchema.items` is optional on both faces, and the zod face requires at least one of `bind` / `items` (objectui#11405).

The `list` renderer reads `useDataScope(schema.bind)` first and falls back to `schema.items` when the bound value is not an array. So a `list` that carries only `bind` draws one entry per element of the bound array. Both published faces nevertheless required `items`: `safeValidateSchema`, the function `objectui validate` calls, refused `{ "type": "list", "bind": "customerNames" }` with `invalid_type` at `items`, the strict face agreed, and the TypeScript face refused the same literal. The published `skills/objectui` guides author that shape in four marked examples.

The accept set moves in one direction only, measured through the arm, `safeValidateSchema` and the strict face against a rebuilt `dist`:

| document | before | after |
| --- | --- | --- |
| `bind` only | refused at `items` (`invalid_type`) | **accepted** |
| `items` only | accepted | accepted |
| both | accepted | accepted |
| neither | refused at `items` (`invalid_type`) | refused at the node (`custom`, `params.code` = `LIST_ENTRIES_REQUIRED`) |

Nothing went from accepted to refused. The rule is at least one and not exactly one, because `items` is the renderer's fallback beside `bind`. Presence is `!== undefined`, as in the record-source refinement the `object-*` arms carry, so `bind: ''` and `items: []` each count. The node-level issue is reported beside any other issue on the node, so a `list` with neither key and a bad `ordered` reports both.

On the TypeScript face `items?: ListItem[]` is optional, so a reader of `ListSchema['items']` now sees `ListItem[] | undefined`. The only reader in this repository, the `list` renderer, already guards the read with `Array.isArray`. The TypeScript face cannot express the at-least-one rule, so a literal with neither key still compiles; the validator enforces it.

Marked `minor` per this repo's version-alignment rule.
