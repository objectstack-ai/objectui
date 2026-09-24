---
'@object-ui/plugin-view': patch
---

fix(plugin-view): a read-only view's menus no longer open empty or on a leading separator

`ManageViewsDialog`'s row `…` trigger rendered whenever a callback was wired, while
every entry under it was also gated on the view being editable. On a read-only row
with the console's props (no `onDuplicate`), the trigger opened an empty 180px strip of
popover. `ViewTabBar`'s tab dropdown and context menu drew each separator on its own
condition, so a read-only tab's menu opened on a separator above "Manage all views…";
a read-only tab with no `onManageViews` opened an empty dropdown and an empty context
menu.

Each menu now resolves its entries once. The trigger renders only when at least one
entry renders, and a separator is drawn only between two groups that both rendered.
Editable views keep every entry they had. `ManageViewsDialog` no longer offers Rename
(menu entry or double-click) when the host wires no `onRename`, since committing it
would call nothing.
