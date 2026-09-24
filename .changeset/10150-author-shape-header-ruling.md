---
---

Comment-only in `@object-ui/app-shell`: the docblock above `clientValidation`'s `AUTHOR_SHAPE_ONLY_TYPES` ended on a plan, to switch the `sharing_rule` edit gate on once the `_diagnostics` ingress was closed. That condition was met (`extractDraftBody` strips the read decorations through the spec's `stripReadDecorations`), the switch was put to the maintainer on objectui#7612, and the ruling was option A: the edit door stays with the server. The docblock now records that ruling beside the condition, and keeps the measurement above it. A source-scan pin requires the docblock to name the ruling's card and the function that closed the ingress.

Declared as releasing nothing because the emit was measured rather than assumed: `AUTHOR_SHAPE_ONLY_TYPES` is not exported, so neither it nor its docblock reaches the emitted `clientValidation.d.ts`; the emitted `.js` carries the comment, and its comment-stripped emit is identical to the base. No published behaviour changes (objectui#10150).
