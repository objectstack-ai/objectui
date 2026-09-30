---
'@object-ui/core': minor
'@object-ui/i18n': minor
'@object-ui/components': patch
'@object-ui/plugin-form': patch
'@object-ui/console': patch
---

fix(components,plugin-form,console,core): a faulted `visibleWhen` refuses the submit, naming the field and the rule; blank gates are diagnosed (objectui#8069)

⚠️ **User-visible, and a narrowing.** A form whose field `visibleWhen` cannot be
evaluated — a typo in a column name, a syntax error, an unbound root — used to
render the field (fail-open) and submit as if the rule had said "show". It now
still renders the field, and **refuses the submit** with a message that names
the field and the rule (`form.visibleWhenFaulted`). This is ADR-0137 D2 as
ruled for objectui#8069 (Q1 = B, one judge per rule): no server evaluates a
field's `visibleWhen`, so its fail-open render direction (D3) was a silent grant
— a field the working rule would have hidden, drawn, edited and written. The
refusal applies on the record form renderer (`form.tsx`, every `ObjectForm`
layout), the console's `/forms/:name` and `/f/:slug` page, and the wizard's
cross-step gate at final submit.

- `requiredWhen` / `readonlyWhen` are **unchanged on the client**: the server
  evaluates both and refuses a faulted one itself (ADR-0137 D2), and the form
  renderer shows that field-attributed refusal beside the input.
- **Accepted residual:** a `visibleWhen` reading `previous` cannot be evaluated
  on a CREATE form, so such a form is refused on every submit.
- A **blank** `visibleWhen` (`''`, whitespace, a blank envelope) is not refused:
  objectui's form wire admits it, so a refusal would be a form nobody can ever
  submit. It stays "no gate" and keeps its `[blank]` warning.

**Added (`@object-ui/core`):** `resolveFieldRuleState` returns `faults` beside
its three verdicts — the per-rule fault report the submit paths read, filled
from the same evaluation — and its type, `FieldRuleFaults`, is exported.
**Added (`@object-ui/i18n`):** the `form.visibleWhenFaulted` key in all ten
packs.

**Diagnosed, no verdict changed (ADR-0137 D4):** a blank CEL gate reaching
`ExpressionEvaluator.evaluateCondition`, and a blank gate folded to "no gate" by
`hasDeclaredPredicate`, now each report once through the same `[blank]` channel
field-rule faults use. Both verdicts (objectui#3850 / #3960) are unchanged,
`throwOnError` included.
