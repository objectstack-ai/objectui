---
'@object-ui/app-shell': patch
---

Setup catalog editors show History and Audit only to a caller the authoring-trail doors admit (objectui#12475). objectstack#23546 narrows `GET /meta/:type/:name/history`, `/audit` and `/diff` to `studio.access` and `manage_metadata` (and system principals), so an organization admin holding `setup.access` alone no longer sees History and Audit buttons that always answer 403 — in `ResourceEditPage` (the buttons and their sheets) and in the permission-set matrix editor (routed and embedded History). The predicate is `useCanReadAuthoringTrail`, beside `useCanAuthorMetadata`; an unreported capability set fails open, as before.
