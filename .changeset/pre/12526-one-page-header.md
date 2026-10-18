---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

Console pages: a dashboard and the Approvals Inbox draw the page header an object list draws, and the top bar draws no breadcrumb on a dashboard or page route (objectui#12526).

- **One page header.** `DashboardView` and the Approvals Inbox render the console page header: an icon chip, the title, the secondary line beside the title from the `sm` breakpoint up, and the page's actions on the right, in one row. Before, a dashboard drew a large bold title with its description on a second line, and the inbox drew a large icon and title, a subtitle line and its Refresh button. The texts are unchanged: a dashboard's served `label` (else its `name`) and `description`; the inbox's title, subtitle and Refresh. A dashboard's chip draws the dashboard icon, since a dashboard document carries no icon of its own. Its "Refresh All" button stays where the dashboard renderer draws it.
- **No breadcrumb on a dashboard or page route.** On `/apps/APP/dashboard/NAME` and `/apps/APP/page/NAME`, `AppHeader` draws nothing after the app pill and its PREVIEW chip from `sm` up, as on an object route since objectui#12461: the dashboard's page header and the page's own heading name the page once. This supersedes, for those two routes, the trails the objectui#12198, objectui#12273 and objectui#12461 entries in this release describe. A report or `system/*` route still draws its breadcrumb.
- **Below `sm`.** The phone bar's compact title still names the dashboard or the page. The dashboard and the inbox keep their header on a phone: the icon, the title and the inbox's Refresh in one row. The page header hides its secondary line below `sm`, so a dashboard's description and the inbox's subtitle are no longer drawn there.

`@object-ui/app-shell` adds one export: `ConsolePageHeader`, the console page header component, and its props type `ConsolePageHeaderProps` (`title`, `subtitle`, `icon`, `actions`, `accentColor`, `sticky`, `className`, `data-testid`). It is not named `PageHeader` because `@object-ui/layout` exports a different component by that name. No prop, option or pack key changes.

**Clause-②: yes.** The package entry widens by that one component and its props type.
