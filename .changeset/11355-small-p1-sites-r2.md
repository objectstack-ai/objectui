---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-gantt': patch
---

Three more reader sites stop riding `BaseSchema`'s index signature (objectui#11355 round 2, part of the preparation for objectui#8347's removal of that signature). None changes runtime behaviour.

**`ActionBarSchema`, the `action:bar` node, is now exported by `@object-ui/types`.** It used to be declared in `@object-ui/components`' `renderers/action/action-bar.tsx`, which is not on that package's entry, so a host could not import it. It now lives in `@object-ui/types`' `ui-action.ts`, beside `UIActionSchema`: `actions` and `systemActions` are `UIActionSchema[]`, and `location` is `@objectstack/spec`'s `ActionLocation`. It declares no `[key: string]: any`, so a literal typed `ActionBarSchema` may write only its declared members, which are the keys the renderer reads. The renderer imports it from `@object-ui/types`, and its parameter annotation keeps its own index signature for the DOM pass-through (objectui#4422). `@object-ui/components` adds no export.

**`ObjectChartSchema.isAnimationActive?: boolean` is declared on the TypeScript face.** Code sets it `false` for a render with no entrance animation: `DashboardRenderer` and `DashboardGridLayout` on the `object-chart` nodes they build, and `DatasetWidget` and `DatasetReportRenderer` on the nodes they hand the `chart` registration. `ChartRenderer` honours it. The zod mirror declares no member for it, so it is not an authoring key; `zod-mirror-parity.test.ts` files it as runtime-only.

**Typed where they stand.**

- `@object-ui/app-shell`: the list-toolbar `action:bar` nodes in `EnvironmentListToolbar`, `InterfaceListPage` and `ObjectView` are built as `ActionBarSchema` values before they reach `SchemaRenderer`.
- `@object-ui/plugin-gantt`: `ObjectGantt`'s dev warning about flat gantt keys that a `gantt` block shadows reads those keys off `ObjectGanttSchema`, which declares every one, instead of through a `Record` conversion.

**minor, not patch, for `@object-ui/types`.** `ActionBarSchema` is a new export, and `isAnimationActive` is a new member in the shipped `.d.ts`.
