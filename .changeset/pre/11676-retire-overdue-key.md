---
'@object-ui/i18n': minor
'@object-ui/plugin-timeline': minor
---

The timeline's unused "Overdue" bucket label is removed: `timeline.bucket.overdue` is gone from all ten language packs and from the timeline's built-in English defaults (objectui#11676).

Nothing has read the key since a past date on a timeline went under "Earlier". No timeline heads a group "Overdue": a date is overdue only when it is a due date and the record is still open, and a timeline declares neither fact. Overdue records are still marked where record state lives: the date cell's due treatment, the gantt's alert colour and conditional formatting.

**Narrowed public surface (`@object-ui/i18n`).** The exported `en` pack and the `TranslationKeys` type derived from it lose one member, `timeline.bucket.overdue`. Code that reads `en.timeline.bucket.overdue`, or passes that key to `t()` expecting a translation, has to drop it. This is released as `minor` under objectui's version policy, which keeps the major aligned with `@objectstack`. The date cell's "Overdue 3d" phrase is a different key, `fields.relativeDate.overdue`, and stays in every pack.
