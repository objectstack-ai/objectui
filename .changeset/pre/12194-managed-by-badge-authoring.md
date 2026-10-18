---
'@object-ui/app-shell': patch
---

The lifecycle badge (`ManagedByBadge`) draws only for a caller who can author metadata (objectui#12194). An end user sees it nowhere: not on the record page, the object list header or the record form page.

The badge labels how an object is built: Admin config, System-managed, Platform schema, Read-only · Audit log, or Identity for a `better-auth` object. That is a word for the people who author the app. To an end user it means nothing. In Chinese the `better-auth` badge reads 「身份」, and it showed on a workspace page the host had authored. The record page draws the badge above the page tree, so an assigned page could not leave it out.

- **Who sees it.** A caller the server grants `manage_metadata` (`useCanAuthorMetadata`, the check the Studio entry points already use). The badge itself checks this, so all three pages follow one rule.
- **Unchanged.** Hidden New, Import and Delete buttons, the list's empty-state guidance for read-only buckets, and the form's read-only notice all stay for every caller. The badge's copy, variants and props do not change.
- **A deployment that does not report capabilities.** If `/api/v1/auth/me/permissions` leaves out `systemPermissions`, or no permission provider is mounted, the check fails open and the badge draws as it did before. The fail-open rule itself does not change.

Clause-②: no. No export, prop, type member, spec key or language-pack key is added, removed or changed. `ManagedByBadge` is not exported from the package entry.
