---
"@object-ui/components": patch
---

A create form no longer locks fields through `readonlyWhen`. The server does not apply `readonlyWhen` on insert, but the form evaluated it against the seeded defaults, so a predicate over a defaulted column (`record.status == 'pending_verify'` with `status` defaulting to `'pending_verify'`) or a `!=` over an unset one (`record.approval_status != 'returned'`) rendered fields read-only on New that the API accepts. `readonlyWhen` now applies only to an edit form (one given `previousValues`), and no longer warns a fault on a create form; static `readonly: true` still locks on create, and `visibleWhen` / `requiredWhen` are unchanged.
