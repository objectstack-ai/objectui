---
---

Comment-only in `@object-ui/app-shell`: the docblock above `ActionPreview`'s `INHERITED_TARGET` quoted the action-param resolver as reading `referenceTo: param.reference ?? field.reference_to`. The resolver has read `field.reference` since objectui#6837 narrowed that read, and `reference_to` is a field-definition key `@objectstack/spec` refuses by name, so the comment pointed its reader at metadata the platform rejects. The quotation now matches the code, and a pin re-derives it from the docblock and requires it to occur, as whole tokens, in the resolver's comment-masked code.

Declared as releasing nothing because the emit was measured rather than assumed: `INHERITED_TARGET` is not exported, so neither it nor its docblock reaches the emitted `ActionPreview.d.ts`; the emitted `.js` carries the comment, and no runtime token moved. No published behaviour changes (objectui#10159).
