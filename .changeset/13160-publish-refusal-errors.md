---
'@object-ui/app-shell': patch
---

A refused package publish on the package sheet shows the reasons the server returned, under the count sentence (objectui#13160).

`POST /packages/:id/publish` refuses on a 200: nothing is published, and its `validationErrors` carry one `message` per reason, each against the item (`type`, `name`) it judged. The sheet showed only "Publish blocked by N validation error(s).", so an author never read why; a package with no items, for one, was refused with "No metadata items found for package …", and the sheet did not say so. The sheet now keeps that sentence as the heading and lists each reason under it in the server's words, led by the item it names when the server names one (`object/lead: …`). A published package, a refusal with no reasons ("Nothing to publish.") and a request that fails read as before.

Nothing is added to the package entry: no export, prop, type member or string-table key.
