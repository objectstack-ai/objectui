---
'@object-ui/types': minor
---

Inside a dashboard widget's legacy `component` envelope, a `metric-card` is now judged by the slot's component arm alone, so every key that arm refuses is refused there too, with the arm's own message (objectui#11709).

BREAKING (`@object-ui/types`): a widget's `component` envelope that holds a `metric-card` the component arm refuses is now refused by `objectui validate`. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `{ "id": "w", "component": { "type": "metric-card", "value": "$123,456", "label": "Total Revenue" } }`
- TO `{ "id": "w", "component": { "type": "metric-card", "value": "$123,456", "title": "Total Revenue" } }`

Why: the envelope's `component` slot was a plain union of the component arm and passthrough `BaseSchema`. A union takes the first arm that parses, and `BaseSchema` admits any node, so a card the arm refused parsed through it on the tolerant face (`safeValidateSchema`, which `objectui validate` runs). That covered `label`, `children`, a `trend` outside `up | down | neutral`, a card with no `value`, and every other value the arm's members refuse. The strict authoring face and the TypeScript twin already refused the same documents. `body` was refused, but by both arms, so the validator printed `BaseSchema`'s message beside the arm's.

**Migration.** Write the card the way it is written directly in `widgets[]`: `title` for the heading, a `value`, `trend` from its enum, and no `body` or `children`. A card the strict face accepts parses exactly as before.

What each face does now:

- **zod (`@object-ui/types/zod`), tolerant face.** NARROWS. The slot reads the node's `type` before the union runs. A `type` the component arm declares (`metric-card`) goes to that arm alone, so its issues come back at their own paths with the arm's own messages, and no `BaseSchema` reading stands beside them. That is the shape the same card already has directly in `widgets[]`. Every other node goes to the same two-arm union as before, so a `custom` widget's `component` keeps the passthrough.
- **zod, strict authoring face.** It already refused the documents above. It is derived from the same slot, so its refusal now also arrives as the arm's issues alone. It NARROWS in one corner: a card with no `value` that carries only `BaseSchema` keys (`{ "type": "metric-card" }`, or that plus `id` / `className`) used to parse there through the strict `BaseSchema` arm, and is refused now for its missing `value`.
- **TypeScript.** Unchanged. `DashboardWidgetSchema.component` already refused every literal above, that corner included.

**Supersedes a line of objectui#4425's note.** That note says the tolerant face still accepts a `label` inside the `component` envelope, through the envelope's `BaseSchema` fallback. It is refused there now.

Nothing widens, and no export is added. The routing is module-private, like the component arm itself.
