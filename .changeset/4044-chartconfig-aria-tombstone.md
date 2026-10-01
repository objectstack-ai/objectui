---
'@object-ui/types': minor
---

**BREAKING (authoring, TypeScript only):** `chartConfig.aria` on a dashboard widget is now a compile error, the same verdict the validator already gives (objectui#4044).

`@objectstack/spec` 17.5.0 retired `ChartConfig.aria` (ADR-0049 D2, objectstack-ai/objectstack#17751).
No chart renderer ever applied it: ARIA attributes written there parsed and never reached the
DOM. The spec now declares the key as a `retiredKey()` tombstone that refuses any value.

- **Zod mirror: no change.** `DashboardWidgetSchema` takes the spec's `chartConfig` by
  reference, so it has refused an authored `chartConfig.aria` since this package began
  resolving 17.5.0. The dashboard node, `safeValidateSchema` and the strict authoring face
  refuse it too, with the spec's own message at `chartConfig.aria`. A new pin records this.
- **TypeScript: changed.** `DashboardWidgetSchema.chartConfig` was typed `any`, so an authored
  `aria` compiled. Its `aria` member now comes from the spec's own input type and admits no
  value, so authoring one is a compile error. Every other `chartConfig` key keeps its previous
  typing.

What to do: delete the key. The accessible name a chart does apply is `description` on the same
chart config. The chart renderer turns it into `role="img"` plus `aria-label` on the chart.

```ts
// before: compiled, was refused at validation, and labelled nothing
const widget: DashboardWidgetSchema = { type: 'bar', chartConfig: { aria: { ariaLabel: 'Pipeline' } } };
// after: write the accessible name as `description`
const widget: DashboardWidgetSchema = { type: 'bar', chartConfig: { description: 'Pipeline value by stage' } };
```

This is released as `minor`, following this repository's version policy: breaking semantics are
marked `minor` and described here.
