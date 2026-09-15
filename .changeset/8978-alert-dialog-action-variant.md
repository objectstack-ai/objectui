---
'@object-ui/types': minor
'@object-ui/components': minor
---

`alert-dialog` can finally paint the red destructive confirm: `AlertDialogSchema`
declares `actionVariant?: 'default' | 'destructive'` and the renderer reads it
onto the confirm button (objectui#8978, the capability decision batch #70
granted on 2026-09-07).

**Additive, and nothing that renders today moves.** No default changes, no key
narrows, no existing document changes verdict. A document that does not author
`actionVariant` renders a BYTE-IDENTICAL dialog — asserted as the `UNTOUCHED`
control of the pin, not argued — which is also the whole blast-radius answer for
the `AlertDialogAction` call sites across the repo: they pass no variant, so they
get exactly what they got before.

**Why the spelling is not `confirmVariant`.** That key is retired with a
tombstone (objectui#7963) because it was measured inert: it reached no DOM node
at all. Re-adding the same published spelling would be a retire-then-re-add cycle
on the authoring surface — 「协议不应该改来改去啊，否则元数据应用怎么办」
(maintainer, 2026-09-10) — so a document that reds on `confirmVariant` today
still reds on it, with the same code. What moved is one published string: that
tombstone's MESSAGE used to say the key had no replacement and now names
`actionVariant`. `actionVariant` is the `action*` dialect this node already uses
for that button (`actionText`, `onAction`, `AlertDialogAction`), and it is the
same dialect the retirement itself pointed `confirmLabel` at.

**Why two values and not `ButtonSchema.variant`'s six.** ⛔ Not deference — a
measurement. `packages/components/src/ui/**` is a No-Touch zone (AGENTS.md
Commandment #7) and `AlertDialogAction` bakes in `cn(buttonVariants(), className)`
with no variant prop, so the renderer applies the variant as a className
OVERRIDE, and an override can only displace a baked-in class that shares its
tailwind-merge group. Rendered through the real renderer, `default` and
`destructive` land clean; `outline`, `ghost` and `link` leave the primitive's own
background and/or text colour visible underneath. Declaring a value this node
cannot render is the `confirmVariant` disease one level down, at the value
instead of the key — so the union is exactly what the channel carries, and the
pin measures the admitted values AND the refused ones, so widening the union
without widening the mechanism reds.

**The pin has a firing control**, which is the point of the exercise:
`packages/components/src/__tests__/alert-dialog-action-variant-8978.test.tsx`
renders the dialog and reads the confirm button's own `class` off the DOM — never
that a prop was passed — with the expected tokens computed FROM `buttonVariants`
rather than typed in, so an upstream rename follows instead of going stale.

The two schema-catalog fixtures whose confirm button authored `variant:
"destructive"` before PR #7962 had to strip it (`basic-alert-dialog`,
`destructive-action`) get it back, in the dialect the renderer reads.
