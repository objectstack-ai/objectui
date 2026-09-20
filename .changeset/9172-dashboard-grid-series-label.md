---
'@object-ui/plugin-dashboard': patch
---

Fix `DashboardGridLayout` composing chart series with no `label` at all
(objectui#9172), so a grid-laid-out dashboard legended a measure like
`close_date` under the raw field key while the read-only `DashboardRenderer`
relay legended the same widget "Close Date". The three-arm label decision
(synthetic aggregate name / bundle-or-humanized field label) is now
`composeSeriesLabel` (`packages/plugin-dashboard/src/utils.ts`), a single
authority both relays call, rather than a second copy of the logic.
