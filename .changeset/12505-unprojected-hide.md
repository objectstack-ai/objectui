---
'@object-ui/app-shell': patch
---

Hiding columns on your own saved view now sticks, even when the view declares no `columns` (objectui#12505).

**What changes for users.** On a saved list view that declares no `columns`, the console draws the object's default columns. Hiding one of them with Hide Fields used to last only for the session, so the column came back on reload. The choice is now stored on the user's own list state (the `ui.list.<object>` row in `sys_user_preference`, beside the sort and the column layout) and applied on every later visit, in any browser. It is still never a write to the shared view (`/meta/view`): another user sees the default columns.

- **It only subtracts.** The stored list removes columns from the drawn defaults and never adds one. A name the defaults no longer contain (a removed field, for example) hides nothing.
- **Field security is unchanged.** A column the user may not read is neither offered in Hide Fields nor stored.
- **The view's own `hiddenFields` still needs `columns`.** On a view that declares no `columns`, the view's authored `hiddenFields` does not apply (objectui#10694); only the user's own choice does.
- **System views are unchanged.** On a system view that declares no `columns`, hiding a column still lasts for the session only; its author's remedy is to declare `columns`.
- **Resetting.** "Reset view" in the page header's ⋯ menu drops the stored choice, and the list opens on the default columns again.
