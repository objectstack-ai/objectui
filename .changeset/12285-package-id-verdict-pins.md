---
---

Clause-②: no

Test-only change (objectui#12285); no published behaviour changes. A member opening a withheld app at its package-id URL already sees the access-denied screen: the console sends the URL segment to `GET /api/v1/meta/app/KEY`, and since objectstack-ai/objectstack#23183 (in `@objectstack/*` `18.0.0-next.2`) that route answers a package-id key with `403 PERMISSION_DENIED` for a withheld app and `404` for an unknown one. New pins in `@object-ui/app-shell` and `@object-ui/data-objectstack` hold both verdicts for the package-id key, plus the by-name and holder controls.
