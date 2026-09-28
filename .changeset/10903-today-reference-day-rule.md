---
---

Comment-only in `@object-ui/core`: the built-in `TODAY()` formula function now carries a docblock stating which calendar day it names, as ruled on objectui#10903 (option A). A client-evaluated `TODAY()` names the same reference day the server resolves for that user, on the compute-tz axis of objectstack ADR-0053, and the UTC day while no reference timezone reaches the client. The implementation reads no timezone, so it answers the UTC day, which is the ruled fallback; nothing it returns changes.

Declared as releasing nothing because the emit was measured rather than assumed: the docblock sits inside the private `registerDateFunctions` body, so it cannot reach the emitted `FormulaFunctions.d.ts`, and the comment-stripped emit of `FormulaFunctions.ts` is byte-identical to the base. No published behaviour changes (objectui#10903).
