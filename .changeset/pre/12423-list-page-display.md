---
'@object-ui/plugin-list': minor
'@object-ui/plugin-view': minor
'@object-ui/components': minor
'@object-ui/plugin-grid': minor
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/i18n': minor
---

The console list page spends less of the screen on chrome (objectui#12423).

- **Four controls on the list toolbar.** The bar now shows Filter, Sort, Display and Search. Display is the former "View settings" panel, opened by default on every list: a Layout row (the visualization switcher, when the list offers more than one), Group, Row color, Hide fields, Density, a Row numbers switch and an Edit inline switch, with Reset to view default, Refresh and Export in its footer. The Display button shows how many of these differ from the view's own settings, and Reset hands them all back. Each control still saves exactly what it saved before; Row numbers lasts for the session only and starts on. A view that sets `compactToolbar: false` keeps the old toolbar, one button per control.
- **View tabs fit the width.** The view tab strip shows as many saved views as fit and folds the rest into the "N more" menu; `maxVisibleTabs` is now an optional cap on top of the width. A table view's tab is its name alone, other view types keep their icon, and the small filter, sort and default-view marks on tabs are gone. The current tab's menu still offers every action, and "Set as default" now shows which view is the default.
- **Grid rows.** With selection on, the first cell of a row shows the row number and swaps to the checkbox on hover, on keyboard focus, on touch screens and on every row while any row is selected; the header keeps its select-all box. With row numbers off the cell is empty until hover. The row actions button appears on hover, on focus and on a selected row, and stays reachable by keyboard.
- **One-row page header.** On desktop the list page header is a single row: icon, title, then the description, with the actions on the right. The favorite star is no longer in this header. Phones are unchanged.

For integrators: `ObjectGrid` takes a `showRowNumbers` prop (on unless set to `false`); the `ViewTabBar` config's `showIndicators` is deprecated and draws nothing; the language packs gain `list.display`, `list.layout`, `list.rowNumbers` and `list.resetToViewDefault`, and drop `list.viewSettings`, `list.viewSettingsHint` and `list.recordEditingTitle`.
