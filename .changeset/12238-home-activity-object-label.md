---
'@object-ui/app-shell': patch
---

Home's activity card names each row's object by its label in the reader's language (objectui#12238).

Each row's second line printed the object's API name as `sys_activity` stores it, so a lead row on Home read `3 hours ago · crm_lead` beside a summary that already used the object's label. The bell's Activity tab stopped doing this in objectui#12212; Home now renders the same component for the same row, so the two surfaces name an object one way: the definition's `label` from the object list the console already caches, through the object translation bundle (`objects.<name>.label`), and the API name only when no definition or bundle names the object. The list is read only while an activity row is on screen. The row's summary is unchanged, and `sys_activity` still stores `object_name`.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
