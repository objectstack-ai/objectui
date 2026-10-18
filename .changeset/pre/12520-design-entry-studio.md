---
'@object-ui/app-shell': patch
---

The console sidebar's ⋯ menu Design entry, and a favorite's Design entry, open the item's Studio surface: the same destination the app bar's Edit app opens for that item (objectui#12520). They used to open the metadata-admin page, which tells an admin that a packaged object is locked and cannot be edited, while the app bar's pencil opened the same object in Studio.

- **One derivation for both controls.** The Design entry asks the function the app bar already uses, `appStudioRoutePath`, for the route the entry opens. An `object` entry opens Studio's Data surface (`/studio/PACKAGE/data?surface=object:NAME`). A `dashboard` entry opens the Interfaces surface (`surface=dashboard:NAME`), and a `page` entry opens the Interfaces surface (`surface=page:NAME`), as the app bar does on a page. A packaged item opens there read-only, as Studio already shows packaged items.
- **A favorite resolves in its own app.** A favorite opens the package of the app its own address names. That app can differ from the one the sidebar is drawn in.
- **No Studio surface, no Design entry.** An entry of an app with no owning package Studio can open (a runtime app, or the DB-authored `sys_metadata` pseudo-package) shows no Design entry, just as the app bar shows no pencil there. Before, such entries opened the metadata-admin page.
- **Unchanged.** The gate: the entry shows only to a workspace admin who may author metadata. The metadata-admin route and its own entry points. Which entry types offer Design.

Nothing is added to the package entry: no export, prop or type changes.
