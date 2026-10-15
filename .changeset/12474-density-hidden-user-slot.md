---
'@object-ui/app-shell': patch
---

A list's density and hidden fields are now each user's own, like its sort and column layout, and follow them to another browser (objectui#12474).

**What changes for users.** Changing a list's row density in the toolbar's Display panel, or hiding and showing columns with Hide Fields, is now personal: it no longer changes the view for everyone. Before this change both were saved into the shared view (`/meta/view`), so one user's click changed the list for every other user, and under a walled tenancy posture (`group` or `isolated`), where only the platform operator may write environment metadata, the click ended in an error. The view's own `rowHeight` and `hiddenFields` stay the default for every user who has not changed them, and the view editor is still how an author changes them for everyone. No list toolbar control writes the shared view any more.

- **Where it is kept.** The same `sys_user_preference` row as the sort and the column layout (key `ui.list.<object>`), as two more parts of a view's entry: `rowHeight` (one of the spec's five row heights) and `hiddenFields` (the column names the user hid). An empty `hiddenFields` is kept: it means "show every column", which is not the view's own list.
- **Hidden fields only subtract.** A user's hidden fields apply only on a view that declares `columns`, and only remove columns from them: they never add a column the view does not declare. On a view that declares no `columns`, system or saved, hiding a column lasts for the session and is not stored (the same rule as objectui#10694). A saved view's hide used to persist there only because the shared write stored the drawn default columns as the view's own; the author's remedy is to declare `columns`.
- **Resetting.** "Reset view" in the page header's ⋯ menu now drops the stored density and hidden fields too, with the sort, filters and column layout. Rows written by earlier toolbar toggles into a view stay, and remain the default every user sees until a user chooses their own.
