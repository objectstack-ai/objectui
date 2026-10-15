---
'@object-ui/app-shell': minor
'@object-ui/data-objectstack': minor
'@object-ui/i18n': patch
---

A list's sort, column layout, Filter panel and tab order are now each user's own, and follow them to another browser (objectui#12418).

**What changes for users.** Sorting a list, resizing or moving its columns, and dragging the tabs in Manage Views is now personal: it no longer changes the view for everyone. Before this change, a header sort or a column drag was saved into the shared view, and a Manage Views drag saved a new order onto every saved view, so one user's click re-sorted or reordered the list for every other user. Under a walled tenancy posture (`group` or `isolated`), where only the platform operator may write environment metadata, the same click ended in an error. The view's own sort, columns, filter and tab order stay the default for every user who has not changed them, and the view editor (the view settings panel and Studio) is still how an author changes them for everyone. Density and hidden fields are not part of this change: they are still saved to the view.

- **Where it is kept.** One `sys_user_preference` row per user and object, key `ui.list.<object>`, holding `{ viewOrder, perView: { <view id>: { sort, filters, columnState } } }`. The console reads every such row in its one preference read at load (objectui#12187), so this adds no request. localStorage (`list-state:<user>:<object>`) is the write-through cache, and the only store when no preference backend is attached. The first read of an object with nothing cached takes that browser's older tab order (`viewOrder:<object>`) and Filter panel conditions (`list-filters:…`). The search term stays where it was.
- **Opening a list.** A list now opens on the user's stored sort and Filter panel conditions, and the page waits until the preference read has answered (2.5 s at most) before drawing it. A link that carries list state still wins over the stored state, as before (objectui#11860).
- **Resetting.** The Filter panel's "Clear all" clears the user's stored filters for the view. A new "Reset view" entry in the page header's ⋯ menu, beside the favorites entry, appears when the user has stored anything for the active view. It drops that view's sort, filters and column layout and opens the list as the view declares it. An administrator can delete a user's row under Setup → User Preferences.

`@object-ui/data-objectstack` adds `createObjectStackUserPreferenceFamily` (with the `UserPreferenceFamily` and `ObjectStackUserPreferenceFamilyOptions` types and the `PREFERENCE_FAMILY_ROW_LIMIT` constant). It loads every row whose key starts with a prefix, through the same shared read as the per-key adapters. A read that includes a prefix asks for its keys or that prefix, with a `$top` of the key count plus 200 rows per prefix. When an answer fills that `$top`, a key whose row is missing from it reads its own row. `createObjectStackUserStateAdapter` keeps its signature and its behaviour.

`@object-ui/i18n` adds `console.objectView.resetView` and `console.objectView.resetViewTitle` in all ten packs.
