---
'@object-ui/app-shell': patch
---

Metadata admin detail pages no longer overprint their header on a narrow window (objectui#12306).

The one-line header of an item page (for example a permission set's matrix editor in Setup) kept the breadcrumb, the type and writability chips, the subtitle, the stats and the actions on one row that never wrapped. When the window was too narrow for all of them, the breadcrumb was squeezed to nothing and its links were drawn underneath the chips: at an 820px window the row read "All Metadata T…SECURITY Pe create-only P…", and at a phone width the actions were pushed off the right edge.

The header now wraps instead. The breadcrumb keeps its own line and truncates only the item name, and only when that line is narrower than the breadcrumb. The chips, subtitle, stats and actions move below it, with the stats and actions still right-aligned. When everything fits on one row the header looks exactly as before. A header whose content is slightly wider than its row, which used to cut the item name short, now shows the full name on its own line instead.

The list page header is unchanged. Nothing is added to the package entry: no export, prop, type member or language-pack key.
