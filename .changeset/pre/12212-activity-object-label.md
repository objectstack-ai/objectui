---
'@object-ui/app-shell': patch
---

The bell's Activity tab names each row's object by its label in the reader's language (objectui#12212).

Each row's second line printed the object's API name as `sys_activity` stores it, so a row read `Updated User Preference "ui.recent"` above `… · sys_user_preference`, and a lead row `… · crm_lead`. The line now shows the object's label: the definition's `label` from the object list the console already caches, through the object translation bundle (`objects.<name>.label`), so a zh-CN reader sees the translated name. The API name is shown only when no definition or bundle names the object. The list is read once for the whole object type, never once per row, and only while Activity rows are on screen. The row's summary is unchanged, and `sys_activity` still stores `object_name`.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
