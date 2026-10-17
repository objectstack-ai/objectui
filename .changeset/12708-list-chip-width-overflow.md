---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/plugin-grid': minor
'@object-ui/console': patch
---

Lists at narrow widths: a status chip is never cut to "Publish…", a table wider than its panel shows that it scrolls, and the Actions column is drawn only when a row offers an action.

- **Chip columns.** A `data-table` column flagged `chips: true` (a new optional `TableColumn` member) is never narrower than its widest drawn chip among the rows on screen, measured once per data load. The floor applies over a declared width and a user's resize; text columns keep their width and truncate first. `ObjectGrid` sets the flag on `select`, `status`, `multiselect`, `radio`, `checkboxes` and `tags` columns.
- **Wide tables show they scroll.** One shared affordance, exported from `@object-ui/components` as `HorizontalOverflowBox`, its props type `HorizontalOverflowBoxProps` and `PINNED_RIGHT_SEAM_SHADOW_CLASSES`: a right-edge shadow while columns remain to the right, and the scrollbar on hover. `data-table`'s own scroll box uses it, as do the grouped grid's scroller (where the shadow sits at the pinned Actions column's edge; it had none) and the Approvals Inbox table (it had none).
- **Actions column.** `ObjectGrid` draws the Actions column only when at least one row on screen offers an inline button or a menu item, after the actions' capability gates, per-record predicates and record-level permission verdicts. A list whose rows offer nothing no longer shows an empty "Actions" header.
