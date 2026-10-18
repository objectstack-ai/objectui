---
'@object-ui/app-shell': patch
---

The flow designer names a schedule flow "Schedule", not "Schedule (cron)" (objectui#12845).

The schedule trigger kind runs every cadence the engine binds: cron, interval and once. The Start node's Trigger select, the New automation trigger picker and the flow header's Trigger pill all read one option list, and its `schedule` option said "Schedule (cron)", so an interval or once flow was labelled a cron. The option now reads "Schedule" (zh 「定时」, the word the header's flow-type labels already use), whatever cadence the flow stores. The cadence itself is the Cron schedule field's to show (objectui#12779). The Trigger field's help no longer says schedule triggers fire on a cron: it names the three cadences (a cron, an interval or a set time). The stored `schedule` token and every field gating are unchanged.

The label lives in the metadata-admin designer's own string tables (en and zh); no language-pack key changes.
