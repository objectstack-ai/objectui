---
'@object-ui/components': minor
'@object-ui/plugin-grid': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-charts': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/i18n': patch
---

BREAKING (`@object-ui/components`): `RefreshIndicator`'s `ariaLabel` prop is now required and has no default. It used to default to the English literal "Refreshing", so the progress bar on every view that passed no name was announced in English to screen-reader users in every locale (objectui#10580). A `RefreshIndicator` rendered without `ariaLabel` now fails to type-check.

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

Migration: pass the bar's accessible name from your own translation layer, for example `ariaLabel={t('grid.refreshing')}`. The component renders the string you pass as the bar's `aria-label` and does not translate it.

`ObjectGrid`, `ListView`, `ObjectChart` and `ObjectDataTable` now name their refresh bar in the active locale. The grid and the list read the `grid.refreshing` and `list.refreshing` keys their pull-to-refresh text already uses. The chart reads `chart.refreshing` and the dashboard data table reads `dashboard.refreshing`, both with no English literal behind them, so a host that renders either one with no i18next instance at all gets the key itself as the bar's name.

`@object-ui/i18n`: new keys `chart.refreshing` and `dashboard.refreshing` in every built-in locale pack.
