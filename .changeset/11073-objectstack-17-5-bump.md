---
'@object-ui/types': minor
'@object-ui/core': minor
'@object-ui/data-objectstack': patch
'@object-ui/fields': patch
'@object-ui/components': patch
'@object-ui/plugin-list': patch
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

objectui now resolves `@objectstack/*` 17.5.0 and `zod` 4.6.5, and follows every contract move that release makes (objectui#11073). `@objectstack/spec` 17.5.0 and `@objectstack/core` 17.5.0 require `zod ^4.6.1`, so objectui's own `zod` resolves to the same 4.6.5: two zod minors do not type-check against each other.

⚠️ Breaking in places, marked `minor` under this repo's version-alignment rule (a `major` in the fixed group would move all of it off the `@objectstack` major). Every narrowing below is the spec's own, and already reaches any consumer that resolves `@objectstack/spec ^17.5`.

- `@object-ui/types`: declares `@objectstack/spec ^17.5.0` and `zod ^4.6.1`. A named list view's `pageName` and `tabs` are retired, as the spec retired them: typed `never` and refused by name at parse. `DashboardWidgetSchema` attaches the spec's two new checks (`checkDashboardWidgetStageOrder`, `checkDashboardWidgetMetricMeasureArity`), so a widget the spec refuses is refused here too. Where a strict object is an arm of a plain union, its unknown-key refusal is terminal again (the spec's own mechanism, needed under zod 4.6): the union answers with every arm instead of the one that failed only on unknown keys. That changes the error shape, never the verdict (measured on every objectui union). Two by-name named-view checks that can no longer run are retired; the spec's refusal answers those documents.
- `@object-ui/core`: declares `@objectstack/spec ^17.5.0`. `page` leaves the list-view kinds the normalizer knows, as the spec removed `type: 'page'`. `isRefusedTextComparand` and `textComparandRefusalReason` are re-exported from `@objectstack/spec/data`, whose copies are byte-identical. `SPEC_ACTION_KEYS` lists `execution`, which `ActionSchema` now declares.
- `@object-ui/data-objectstack`: declares `@objectstack/spec ^17.5.0`, up from `^17.4.0`. Its bundle carries `@object-ui/core`'s filter converter, which now takes `isRefusedTextComparand` and `textComparandRefusalReason` from `@objectstack/spec/data`. `@objectstack/spec` 17.4.0 exports neither, so the old range admitted a spec under which the shipped module names exports that are not there (objectui#5793's floor gate). Nothing moves at runtime in this repository, because the lockfile already resolves 17.5.0. `patch`, as the floor raise of objectui#10864 was.
- `@object-ui/fields`: the percent and number `scale` clamp is gone, at the sunset its own test named. The spec now refuses a `scale` above 100 at the declaration, so the width a formatter cannot render no longer arrives, and every face passes the declared width through as it did before the clamp.
- `@object-ui/components`: two module-local prop interfaces of the action renderers are renamed (`ActionButtonRendererProps`, `ActionIconRendererProps`), because the spec now exports the old names for its authored props. Neither is reachable through the package's exports map; only the shipped per-file declarations change.
- `@object-ui/plugin-list`: the README's view-type example no longer lists the retired `page` kind.
- `@object-ui/app-shell`: the flow designer follows 17.5.0 (maintainer ruling on objectui#11088, decision 2). A new `wait` node is seeded `waitEventConfig: { eventType: 'timer', timerDuration: 'PT1H' }`, because the spec now refuses a timer wait with no duration; the inspector shows the Duration at once and it can be changed. The decision form offers the spec's new `mode` (exclusive or inclusive), with no default declared because the spec applies none. The screen form's `mode` states `create` again, because the spec now applies that default. `minor` because the decision form gains a control.
- `@object-ui/app-shell`: declares `@objectstack/spec ^17.5.0`, up from `^17.4.0`, and `zod ^4.6.1`, up from `^4.4.3`. The designer now states 17.5.0 behaviour. The screen form's declared `create` default equals a default the spec applies only since 17.5.0, and objectui#9109 requires the two to be equal, so a range that admitted 17.4.0 claimed more than the designer holds to. The resolved versions do not move.
- `@object-ui/console`: the bundle inlines the 17.5.0 packages, so its client-side validation answers as the published 17.5.0 contract does. The flow preview sample's script nodes use the 17.5.0 script contract. The eager-closure budget is re-baselined for the release's growth, under the maintainer ruling on objectui#11088 (decision 1).
