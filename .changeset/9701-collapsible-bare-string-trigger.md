---
'@object-ui/components': patch
---

**A `collapsible` whose `trigger` is a bare string now renders instead of landing in the error boundary** (objectui#9701).

Both published faces accept a bare string on this key — the TypeScript union `SchemaNode` names `string` explicitly, and the zod mirror types `CollapsibleSchema.trigger` against that same union — but the renderer handed the slot to `CollapsibleTrigger` with `asChild` written unconditionally. `asChild` resolves the Radix primitive to its `Slot`, which merges onto its child by way of `React.Children.only`: it takes a single React element and refuses everything else with `Primitive.button failed to slot onto its children`. So `trigger: 'Show more'` passed validation on both faces and then threw, and the whole node painted `Component "collapsible" failed to render` with no diagnostic naming the key.

`asChild` is now conditional on Radix's own structural precondition — the rendered slot being a single React element. Where it is not, the primitive renders its own `button` around the returned content, so a bare string paints as the trigger's text and stays a real, toggling trigger. The same refusal covered a multi-node trigger array and an empty slot's `null`, which are that one structural mismatch wearing different values; all of them now take the primitive's own button. An element trigger keeps the merge byte for byte, which is asserted as a control in `collapsible-bare-string-trigger-9701.test.tsx` rather than assumed.

⛔ **No published face moves.** `packages/types` is untouched: the accept set is the one both faces already shipped, and this is the implementation catching up to it rather than a narrowing or a widening. The sibling key `content` on the same arm was measured in the same run and never had the defect — it carries no `asChild` — so the pair is enumerated rather than assumed alike.
