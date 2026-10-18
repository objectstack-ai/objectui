---
'@object-ui/plugin-view': minor
'@object-ui/console': minor
'@object-ui/layout': minor
'@object-ui/components': minor
'@object-ui/fields': minor
---

Screen readers can name and reach the controls of the view tab bar, the settings form, the sidebar menus, the table's selection column and the percent cell (objectui#11690). axe-core (wcag2a + wcag2aa) on an object list page and on a Setup settings page reported the faults below; each is fixed where it is produced and pinned by an axe run on that component.

- **View tab bar (`ViewTabBar`).** The "+" add-view button is named, through the existing `view.addView` key, and its tooltip reads the same translated words instead of a hard-coded "Add View". Each view is now a `<button>`; the current one carries `aria-current="true"`. The views were `role="tab"` elements with no `tablist`, and the active view's actions button sat inside its tab, so it was a control inside a control. That button is now the view button's sibling, still named "View actions for …" and still one Tab stop away. Tab roles could not hold it: a tab's content is presentational and a tablist may contain only tabs. These views never had the tabs keyboard model (arrow keys, a tab panel) either. Every view stays its own Tab stop. When the bar is not reorderable, as the console renders it, Enter or Space switches to the focused view. With drag-to-reorder on, Enter or Space on a view starts a keyboard drag instead, as it did before this change, so a view is switched to by click. The rename box is now outside the view button and is named through `view.rename`. With drag-to-reorder on, the sortable attributes describe the view as a button. Breaking for anything that queried the bar by `role="tab"` or `aria-selected`: query `data-testid="view-tab-ID"` or `aria-current` instead.
- **Settings form (`@object-ui/console`).** Each row's label is bound to its control, so text, number, password, textarea, JSON, colour, switch and select controls are named by it. Clicking a label now focuses or toggles its control. A radio group and a multiselect checkbox group are named by the row label too.
- **Sidebar menus (`NavigationRenderer`).** With drag-to-reorder on (the desktop default), every row was wrapped in a `<div>` between the menu's `<ul>` and its `<li>`. The sortable node is now the row's own `<li>`. A separator and a nested group inside a menu are now list items too: the separator's item is hidden from assistive tech, and a top-level group is unchanged.
- **Table selection column (`data-table`).** The select-all checkbox and each row's checkbox are named through the existing `table.selectAllRows` and `table.selectRow` keys.
- **Percent cell (`PercentCellRenderer`).** The progress bar is named by the formatted value beside it (`aria-labelledby`), so the name is in the viewer's locale.

No language-pack key, export or prop is added; every new name reads a key the packs already carried.
