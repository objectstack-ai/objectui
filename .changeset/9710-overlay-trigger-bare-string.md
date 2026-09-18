---
'@object-ui/components': patch
---

**A bare-string `trigger` now renders on every overlay block that declares one, instead of landing in the error boundary** (objectui#9710).

objectui#9701 repaired one instance of this. Eight sibling renderers — `alert-dialog`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `popover`, `sheet` and `tooltip` — carried the identical shape: the authored slot handed straight to a Radix `*Trigger` with `asChild` written unconditionally. `asChild` resolves the primitive to its `Slot`, which merges onto its child through `React.Children.only`: a single React element, and nothing else. Both published faces say a bare string is legal on these keys — the TypeScript union `SchemaNode` names `string` explicitly, and the zod mirror types each `trigger` against that same union — so `trigger: 'Open it'`, the most natural thing to write for something called a trigger, validated twice and then threw, painting `Component "…" failed to render` with no diagnostic naming the key.

`asChild` is now conditional on Radix's own structural precondition, through one shared seam (`asChildSlotProps`) rather than eight copies of the predicate: the rendered slot being a single React element. Where it is not, the primitive renders its own element around the returned content, so a bare string paints as the trigger's text and stays a real trigger. A multi-node trigger array and an empty slot's `null` are that same structural mismatch wearing different values and are answered on the same arm. An element trigger keeps the merge, asserted as a control rather than assumed.

⛔ **No published face moves.** `packages/types` is untouched: the accept set is the one both faces already shipped, and this is the implementation catching up to it — the direction objectui#7105 ruled for node slots, which relax the renderer rather than narrow the declaration.

`context-menu` declares the same key and is deliberately unchanged: its `asChild` child is a real `div`, so the rendered slot goes inside it and `Children.only` never sees the string.
