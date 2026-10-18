---
'@object-ui/app-shell': minor
'@object-ui/plugin-list': minor
'@object-ui/console': minor
---

Setup draws one page header on every page: the `sys_*` record lists, the metadata-type pages, the settings pages and the component pages.

- **One header, a Setup posture.** Inside the Setup app the console page header (`ConsolePageHeader`) puts the description on its own line under the title: a 32px icon tile, an 18px title with the page's kind chip after it, a 13px muted description, Refresh as an icon button and the primary action at the right. The title sits at the same place on every Setup page. Outside Setup the header keeps its one row. `ConsolePageHeader` takes three new optional props: `badge` (the kind chip after the title), `breadcrumb` (leading crumbs on the description line) and `refresh` (`{ onRefresh, label, busy? }`, drawn as one icon button before `actions`).
- **Metadata-type pages under Setup** (Positions, Capabilities, Permission Sets and their siblings) drop the "All Metadata Types" breadcrumb and the Items / Filtered tiles. The count reads "18 items" in the description, the source select is a filter chip, the table takes the record list's row height and sentence-case headers, and the source column shows plain text with its explanation in a tooltip instead of a chip on every row. The same page outside Setup (the metadata directory, Studio's "Open in Setup" target) is unchanged.
- **Record lists under Setup** open without the `#` row numbers. `ListView` takes a new host prop for this, `defaultRowNumbers` (default `true`); it is not a view key.
- **Settings pages** keep their form and take the same header. "All settings" is now the first crumb of the header's description line instead of a button at the top of the form.
- **Component pages** — Packages, Packaged automation, Approvals Inbox, Audit Log Browser and App Marketplace — draw their title row through the same header, with Refresh as its icon button.
