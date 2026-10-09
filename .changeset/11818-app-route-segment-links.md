---
'@object-ui/app-shell': patch
---

Console links into an app use the app's route segment, its package id, instead of its name (objectui#11818). ADR-0048 option A routes `/apps/SEGMENT` on the package id and keeps the app name only as a fallback alias. Three places built the address from the name instead.

- **The bell's approvals link.** *View approvals* and *Open Approvals Inbox* opened the approvals page under the app's name. From `/apps/com.example.showcase/…` they went to `/apps/showcase_app/system/approvals`, which is the same app at a second address. They now land on `/apps/com.example.showcase/system/approvals`, using the same resolver as the bell's "View all" links and notification rows. Outside an app, for example on `/home`, the link opens the app the user last had open if it is still active, and otherwise the first active app. Before, it fell back to `setup` there. This matches the approvals card on Home.
- **Recently viewed.** A visit to an object list, dashboard, page or report was recorded only when the URL used the app's name. On the package-id address, which is the one every sidebar link builds, the visit was dropped. It is now recorded, with the address the user visited.
- **The `global:search` page block outside an app.** When the block renders outside `/apps/APP/…`, its record links used the last app's name. When no app was remembered, the app segment was empty, and the link came out as `/apps/OBJECT/record/ID`, with the object's name where the app belongs. They now use an active app's package id. Inside an app the URL's own segment is kept, as before.

No export, prop or route changes.
