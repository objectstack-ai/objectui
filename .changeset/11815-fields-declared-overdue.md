---
'@object-ui/fields': minor
---

A date reads overdue only when its field declares it a deadline, and never once the deadline is settled for the record (objectui#11815).

- **Declared only.** The `date` and `datetime` cells paint the "Overdue Nd" wording and the red colour only for a field that declares `dueLike: true`. The field-name convention that used to turn the affordance on by itself (`due_date`, `deadline`, `expires_at`, `sla_at`, …) is retired: an undeclared date in the past now reads as any past date does, for example "6 days ago". To keep the affordance on such a field, declare `dueLike: true` on it.
- **Settled.** `CellRendererProps` gains an optional `deadlineSettled` boolean. While it is `true`, both cells paint no overdue wording and no red, and read the neutral relative phrase instead. Absent or `false` changes nothing. The host computes it with `isDeadlineSettled` from `@object-ui/core`.
