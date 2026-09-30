---
'@object-ui/plugin-form': patch
---

An edit form that stays open no longer meets the conflict dialog over its own earlier save (objectui#10565).

**Clause-②: no.** No exported symbol, type or prop changes. The change is in which `ifMatch` an edit save sends.

**Before.** Every edit layout (the simple form, `modal`, `drawer`, `tabbed`, `split` and `wizard`) sent `ifMatch` = the `updated_at` of the record it read with `findOne`, on every save. None of them refreshes that record after a save. The first save moves the stored `updated_at`, so the second save from the same open form sent a version the server no longer held. A server that enforces `ifMatch` answered `409 CONCURRENT_UPDATE`, and the user was offered **Keep editing** or **Overwrite** over a conflict with their own first save.

**What changed, in observable terms.**

- After a save lands, the next save of the same record from the same open form sends the `updated_at` that save returned, for every layout. The **Overwrite** retry counts as a save, so the save after it sends the version the overwrite returned.
- A genuine conflict still answers `409`: if someone else saves the record between two saves, the dialog still opens.
- If the form reads the record again and gets a different `updated_at`, the new read's token is sent.
- A record read without an `updated_at` is still saved without `ifMatch`. When a data source's `update` resolves without an `updated_at`, the next save sends the read's token, as before.
- What a save writes is unchanged: an edit still sends only the fields that differ from the record the form read (objectui#10156).
