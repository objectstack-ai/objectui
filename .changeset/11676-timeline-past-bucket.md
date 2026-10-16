---
'@object-ui/plugin-timeline': minor
'@object-ui/i18n': minor
---

An object-bound timeline no longer heads every past date "Overdue": a day before today goes under a neutral "Earlier" bucket, translated in every language (objectui#11676).

Without a `groupByField`, `ObjectTimeline` groups its entries into date buckets, and every day before today went under "Overdue", whatever the date meant. The showcase's Activity Timeline, bound to `created_at`, put all ten tasks under "Overdue", the two Done ones included. A creation date cannot be overdue, and a closed record cannot be either.

"Overdue" needs two facts: that the date is a due date, and that the record is still open. Nothing the timeline reads declares either one. The timeline configuration (`startDateField`, `endDateField`, `titleField`, `groupByField`, `colorField`, `scale`) names no due-date role, and no field option marks a closed state. So a past day is now "Earlier", and the timeline does not guess either fact from a field name or a status value. Today, Tomorrow, This week, Next week, Later and No date are unchanged.

**Widened public surface (`@object-ui/i18n`).** One new key in all ten language packs, `timeline.bucket.earlier`, so the exported `en` pack and the `TranslationKeys` type derived from it gain one member. The timeline no longer reads `timeline.bucket.overdue`, and this release also removes that key from every pack (the "Overdue" bucket label retirement entry). No component prop or exported type changes.
