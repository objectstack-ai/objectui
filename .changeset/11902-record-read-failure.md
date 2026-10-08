---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's record page now says what its record read actually answered: no access, not found, or could not load (objectui#11902). It used to answer every failed read with "Record not found — The record you are looking for does not exist or may have been deleted."

- **A refused read** (the `forbidden` kind of `classifyLoadError`, the shared read classifier the list view's error panel, the activity feed and the attachments panel already use: a 403, or the `PERMISSION_DENIED` envelope that comes with it) renders "You don't have access to OBJECT records", naming the object by its label. The refusal is about the object, so the page says nothing about whether the record exists, and it offers no Retry, because retrying a permission decision cannot change it. A viewer sent a link to a record they cannot read is no longer told it may have been deleted, so they can ask for access instead of reporting a lost record.
- **A failed read** (a 5xx, a transport error, any other rejection) renders "Couldn't load this record" with a Retry button. Retry re-runs the page's own record read; when it succeeds, the record renders.
- **Not found is unchanged.** A read that answers with no record, which is how the data adapter answers a 404, still renders today's not-found copy. A found record renders as before.

The four new strings live beside the not-found rows in the `empty` namespace of every built-in locale pack (`empty.recordAccessDenied`, `empty.recordAccessDeniedDescription`, `empty.recordLoadFailed`, `empty.recordLoadFailedDescription`); the Retry button reads the existing `common.retry`.

**Clause-②: no.** No export, prop, type member or accepted input changes; the new locale rows are additive.
