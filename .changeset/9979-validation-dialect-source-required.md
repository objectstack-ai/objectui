---
---

Re-pin the object validation engine's "nothing evaluable" fixture against the
narrowed expression contract (objectui#9979). Test only; no package is released
by this change.

`@objectstack/spec` narrowed every EVALUATED expression slot — a
`ScriptValidation.condition` among them — from `ExpressionInputSchema` to
`EvaluatedExpressionInputSchema`, where `source` is required and non-blank,
because the CEL engine evaluates `source` and cannot run an `ast` alone. The
migration entry `evaluated-expression-slots-source-required` carries the
ruling. The PERSISTENCE union (`ExpressionInputSchema`) is deliberately NOT
narrowed by that same ruling, so the `ast`-only envelope still travels on the
wire even though no author may write one into an evaluated slot.

The test `fails OPEN on an envelope with nothing evaluable, and says so`
authored the `ast`-only envelope through the typed slot, which stopped
compiling against objectstack `main`. It now pins the same engine behaviour
across the split the spec made:

- the spelling that stays AUTHORABLE — a non-CEL dialect, which the slot's
  `ExpressionDialect` enum still admits and the CEL evaluator still cannot run
  — written through the typed slot;
- the `ast`-only spelling as WIRE data, through a cast that says so, because
  the reader still has to answer for a shape persistence still carries.

No `source` was invented beside the AST. That AST is synthetic and carries no
operands, so no text was ever parsed into it, and the migration's own recovery
(`printCelAst`) answers `null` rather than a guess for an AST it cannot
round-trip — a `source` written there would satisfy the type and lie about the
value.

No runtime code was touched; the engine's reader is unchanged.
