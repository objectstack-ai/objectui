---
'@object-ui/data-objectstack': patch
---

`deleteView` now shows the server's reason when the published half of a view delete is refused (objectui#12416).

`ObjectStackAdapter.deleteView` deletes a view's draft home, then its published home. When the published delete failed, the adapter threw its own sentence ("… is NOT fully removed … retry the delete") and kept the server's error only on `cause`. `formatMetadataError(err)` reads the error's issues or its own message, so the console's Delete view toast showed the adapter's sentence and hid the server's reason. For the `409 RESOURCE_CONFLICT` a package-less delete of a view two packages hold gets since `@objectstack/rest` 18.0.0-next.1, that reason is the `?package=` remedy, and the toast told the user to retry a delete that cannot succeed.

The thrown error's message is now the adapter's sentence followed, on the next line, by the server's reason as `formatMetadataError` renders it (its issue lines, or else the served message unchanged). The sentence still says the view is not fully removed and the published row still serves it. It says "retry the delete" only when the failure is not a 4xx refusal. `cause` and `outcome` are unchanged. A refusal of the draft half is thrown as served, as before.
