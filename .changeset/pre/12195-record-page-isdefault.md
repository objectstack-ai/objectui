---
'@object-ui/react': patch
---

`usePageAssignment` opens an object's default record page: among the record pages served for the object, the one declared `isDefault: true` is returned, and declaration order decides only when none is (objectui#12195).

The hook used to return the first matching record page in served order and never read `PageSchema.isDefault`, so the flag on a shipped page (the platform's `sys_user_detail`, `sys_organization_detail` and `sys_approval_request_detail`, and the showcase's record pages) did nothing. `@objectstack/spec` 18.0.0-next.1 states the rule this follows (maintainer ruling A on objectstack#23015): at most one default record page may exist for an object in a deployment, and a second is refused at `os validate`, at package registration and at metadata save, naming both pages. So the hook adds no tie-break of its own. It reads "the default record page of an object" through the spec's `defaultRecordPageObject`, the same reading those refusals use.

**Who sees a different page.** An app or environment that authors its own record page for an object without `isDefault: true`, for an object that also has a served default record page, and whose page came first in the served list. That page used to open; the default opens now. Ruling A keeps two ways to replace a platform record page: an ADR-0005 overlay saved under that page's own name, and host composition (composing the stack without the platform's page). Shipping a second default is not one: the platform refuses it. With no default for an object, nothing changes: the first matching page still opens, and an explicit `pageName` still wins over the default.

No type, option or export changes (`Clause-②: no`).
