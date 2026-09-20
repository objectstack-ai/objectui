---
---

Teach `check-i18n-dead-keys` to follow a key template assigned to a local variable
ONE HOP before `t()`, and pin the keys that leg makes reachable (objectui#8754,
round 1 of the 2026-09-12 ruling — the instrument round; nothing is deleted here).

Test and tooling only; no package is released by this change.

**The shape.** A component builds the key into a `const` and passes the bare
identifier: `` const k = `ns.family${Cap(kind)}s` `` then `t(k)`. Every leg was
blind to it at once — the argument position sees an identifier rather than a
template, the objectui#7592 key-builder leg needs a function whose whole body is
one returned template, the property-chain leg does not apply below three
segments, and the text safety net sees only the head, which
`occursAtKeyBoundary()` correctly refuses as evidence about a longer key. So
every leaf under the head landed in CONFIRMED, the tier documented as the one to
read first, while a shipping screen rendered it.

**Measured.** The census moves 365 → 357 candidates and **127 → 119 CONFIRMED**;
NEEDS-REVIEW is unchanged at 238 and no key joined either tier. The leg collects
three heads over nine resolved hops, across 322 parsed files of 1605 walked.

**The pin.** `scripts/__tests__/check-i18n-dead-keys.test.ts` now reds when those
keys leave the packs. It spells no pack key: the heads are read off the call
site's own source and the discriminator off its own closed union, and what is
asserted is the cross product's cardinality — so the pin cannot become a textual
hit that pushes the keys it protects back into NEEDS-REVIEW.

**Bounded on purpose.** The leg feeds reachability only; it does not enrol its
heads in the call-site gate's dynamic-family registry, so `check:i18n-keys` gains
no `undeclared-dynamic-family` finding and its behaviour is unchanged. The two
further sub-shapes objectui#7844 records — a template in a same-module resolver's
ARGUMENT, and a template as an ELEMENT of a returned array — stay dark, and are
now written into the script's own "What CONFIRMED does NOT guarantee" class 2
rather than left silent.
