---
'@object-ui/core': minor
---

A gate that is declared but cannot be evaluated is a fault, not "no gate" (objectui#11358)

A `visible` / `hidden` / `disabled` / `enabled` / `condition` value that is present but carries
no evaluable `source` — an `ast`-only envelope (`{ dialect: 'cel', ast }`), a number (`0`), an
object with no `source` (`{}`), an array — used to be folded into "no gate" in silence. So a
bulk action gated that way was offered on the selection bar and ran over every selected record,
and the row menu and the toolbars showed it to everyone (ADR-0137 D4: a gate predicate that is
blank or faulting is "diagnosed, never a silent `true`").

It is now a declared gate that faults:

- `toPredicateInput` keeps the state instead of folding it: it returns a frozen `cel` envelope
  with no `source` (a new member of `EvaluatorPredicateInput`), so `hasDeclaredPredicate` — and
  `@object-ui/components`' re-export `hasDeclaredVisibilityGate` — answers "declared".
  `null`, `undefined`, `''` and blank predicate text are still "not declared", as before.
- `ExpressionEvaluator.evaluateCondition` treats it as a fault: a `throwOnError` caller gets a
  throw, any other caller gets the fail-soft `true` and one report with the `[unevaluable]`
  reason (or the caller's `onFault`). `evalFieldPredicate` tags the same reason instead of
  sending the value to the engine.
- Each reader therefore answers with the fail direction its key already has for a predicate
  that cannot be evaluated: an action's `visible` is hidden on the toolbars, the row menu and
  the selection bar (where no selected record qualifies); a `disabled` is greyed out and
  `ActionRunner` refuses the action; `SchemaRenderer`'s `hidden` hides the node. A `condition`
  still lets the action run, a legacy `enabled` leaves the control enabled and an action
  param's `visible` still shows the param — the directions those keys take on any fault — now
  reported instead of silent.
- The dev-mode schema validator still refuses these values on `visible` / `disabled`.

Breaking for metadata that wrote such a value into a gate: the action it gated now hides (or
greys out) where it used to show.
