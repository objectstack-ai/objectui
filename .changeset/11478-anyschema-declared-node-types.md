---
'@object-ui/types': minor
---

`AnySchema` now includes the node types this package declares and exported
outside it, so `SchemaByType` and narrowing on `type` reach them
(objectui#11478).

The new members are `DashboardWidgetSlotComponentSchema` (`metric-card`), the
six designer schemas (`PageDesignerSchema`, `DataModelDesignerSchema`,
`ProcessDesignerSchema`, `ReportDesignerSchema`, `ObjectManagerSchema`,
`FieldDesignerSchema`), the three report schemas (`ReportComponentSchema`,
`ReportBuilderSchema`, `ReportViewerSchema`), the three AI schemas
(`AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema`),
`ViewComponentSchema` (`DetailViewSchema`, `ViewSwitcherSchema`,
`FilterUISchema`, `SortUISchema`), and `ActionBarSchema` (`action:bar`).

Before this change, `SchemaByType<'detail-view'>` was `never`. It is now
`DetailViewSchema`, and the same holds for each new member's literal. No
value's verdict changes: `AnySchema` keeps its `BaseSchema` arm, which already
admitted every one of these nodes.

`anyschema-declared-node-types-11478.test.ts` keeps the union complete. It
enumerates every exported object type that extends `BaseSchema` with a literal
`type` and fails on any that is not a member. `ActionBarSchema` does not extend
`BaseSchema`, so it is held by name.
