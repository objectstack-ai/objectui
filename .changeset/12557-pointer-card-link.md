---
'@object-ui/app-shell': patch
---

A record pointer card now links to the record it shows, when the reader may read that record (objectui#12557).

A field that declares `referenceVia`, such as an approval request's target or an activity's source, is drawn on the record page as a compact card of the record it points at. When the card's own read returned the record, the card showed it but offered no way to open it. On the approval request page the approver saw the invoice and had to go and find it.

The card's title is now a link to that record's page in the current app. The URL comes from the record page's own record-link builder, the one the lookup values on the same page link through, so the two cannot address different places. A plain click navigates in the app, and a middle-click or a modifier click opens a new tab. A click or Enter on the link does not also copy the row's value. Only the title is the link, so a lookup value shown inside the card stays a link of its own and no link is nested in another.

Nothing else changes. A target that cannot be read (refused, deleted or not found) still shows the same cause-free "This record cannot be opened", with no link. A row that names no target still shows the empty placeholder. A host that publishes no record-link builder, or cannot route to the target object, shows the title as plain text.

No export, prop, type or language-pack key changes.
