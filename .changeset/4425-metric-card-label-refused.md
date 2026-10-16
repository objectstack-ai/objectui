---
'@object-ui/types': minor
---

A `metric-card` placed in a dashboard's widget slot refuses `label` by name and points at `title`, the key its heading is drawn from (objectui#4425).

BREAKING (`@object-ui/types`): a `metric-card` in a dashboard's `widgets[]` that carries `label` is now refused. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `{ "type": "metric-card", "label": "Total Revenue", "value": "$123,456" }`
- TO `{ "type": "metric-card", "title": "Total Revenue", "value": "$123,456" }`

Why: `MetricCard` draws `title` as the card heading and reads no `label`. `label` is how the sibling `metric` node spells its heading, and the card inherited it from `BaseSchema`, so a card authored with `label` validated on every face and drew no heading. Nothing said so: no render-time error or warning, and the parser tier's `validateTree` does not walk a dashboard's `widgets`. The objectui#8284 ruling settles which way to go: one spelling per rendered thing, and the other spelling is refused by name.

**Migration.** Rename the key to `title`. The value keeps its type: a plain string or an inline per-locale map.

What each face does now:

- **TypeScript.** `DashboardWidgetSlotComponentSchema` restates the inherited member as `label?: never`, so a card literal carrying `label` no longer compiles: on the interface, in `DashboardComponentSchema.widgets`, and inside a widget's `component` envelope.
- **zod (`@object-ui/types/zod`).** NARROWS on the tolerant face (`safeValidateSchema`, which `objectui validate` runs) and on the strict authoring face. A `metric-card` entry in `widgets[]` that carries `label` used to parse with the key kept. It is now refused with one `invalid_union` at the widget. Among that union's per-arm issues, the slot's component arm reports an `invalid_type` at `label` whose message asks ``Did you mean `label` → `title`?``. Inside a widget's `component` envelope the strict face refuses it too. The tolerant face still accepts it there through the envelope's `BaseSchema` fallback, the limit the card's other refusals (`body`, `children`, a `trend` outside its enum) already have on that path.

Nothing widens, and no export is added. The refusal message is private to the module, like the arm itself.
