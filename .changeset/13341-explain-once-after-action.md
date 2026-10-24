---
'@object-ui/plugin-detail': patch
'@object-ui/plugin-grid': patch
---

After a save, delete or action, the record page and the list ask the platform's explain engine each record's edit and delete question once (objectui#13341).

One write often reaches the console's data-change bus twice: once when the data source reports it, and again from the page or list that made it. When the second notice arrived while the fresh permission check was still waiting for its answer, the check was thrown away and sent again, so one Setup save could send `POST /api/v1/security/explain` two to six times. Now a notice that arrives while a record's fresh check is on its way joins that check. A check that was already on its way before the write is still discarded and asked again, and a change announced after the check has answered still asks again, so Edit and Delete still follow the record's state after the write.

The list also stops asking again about rows whose answer is already on its way when its own re-read changes the rows on screen, and asks only about the rows nobody has asked about yet. A list whose rows go past the server's batch limit now sends its batches at once instead of one after another.
