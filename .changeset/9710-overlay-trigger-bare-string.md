---
'@object-ui/components': patch
'@object-ui/types': patch
---

**A bare-string `trigger` now renders on every overlay block that declares one, instead of landing in the error boundary** (objectui#9710).

objectui#9701 repaired one instance of this. Eight sibling renderers — `alert-dialog`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `popover`, `sheet` and `tooltip` — carried the identical shape: the authored slot handed straight to a Radix `*Trigger` with `asChild` written unconditionally. `asChild` resolves the primitive to its `Slot`, which merges onto its child through `React.Children.only`: a single React element, and nothing else. Both published faces say a bare string is legal on these keys — the TypeScript union `SchemaNode` names `string` explicitly, and the zod mirror types each `trigger` against that same union — so `trigger: 'Open it'`, the most natural thing to write for something called a trigger, validated twice and then threw, painting `Component "…" failed to render` with no diagnostic naming the key.

`asChild` is now conditional on Radix's own structural precondition, through one shared seam (`renderTriggerSlot`) rather than eight copies of the predicate: the rendered slot being a single React element. Where it is not — a bare string, a number, a multi-node array — the primitive renders its own element around the returned content, so a string paints as the trigger's text and stays a real trigger. An element trigger keeps the merge, asserted as a control rather than assumed.

**An EMPTY trigger is a separate arm, and it was never broken.** Read from the lockfile-pinned `@radix-ui/react-slot`, the throwing branch is guarded by `if (children || children === 0)`, so a `null` child is returned as-is: omitting the trigger never threw. `trigger` is `.optional()` on `dialog`, `alert-dialog`, `sheet`, `drawer` and `tooltip`, so a document that omits it is legal — and such a document renders **no trigger element at all**, exactly as before this change. The same seam carries that rule, because a `*Trigger` with no content still paints its own element, and an empty `button` is an unlabeled tab stop with nothing to read. `OMITTED_TRIGGER_PAINTS_NOTHING` in the class pin holds that arm; it reads the optional/required split from the published zod faces rather than a list.

⛔ **No published face moves.** `packages/types` is untouched: the accept set is the one both faces already shipped, and this is the implementation catching up to it — the direction objectui#7105 ruled for node slots, which relax the renderer rather than narrow the declaration.

`context-menu` declares the same key and is deliberately unchanged: its `asChild` child is a real `div`, so the rendered slot goes inside it and `Children.only` never sees the string.

**`@object-ui/types` ships corrected read-site documentation, and nothing else.** The eight `trigger` docblocks named `renderChildren(schema.trigger)` inside each Radix trigger; after this change the renderers spell that read `renderTriggerSlot(XTrigger, schema.trigger)`, so the JSDoc an author's editor shows described a call that no longer exists. Those eight now name the current spelling, and the line addresses they carried are gone — `packages/components` moves lines, nothing re-derived those numbers, and the shipped documentation should not rot with them. ⛔ No type, no accept set and no export moves in this package.
