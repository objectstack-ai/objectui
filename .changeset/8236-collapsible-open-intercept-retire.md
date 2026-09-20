---
'@object-ui/components': minor
'@object-ui/types': minor
---

Stop `collapsible` from honouring an authored `open`, and retire the declaration on both
published faces (objectui#8236, ADR-0049 enforce-or-remove).

**BREAKING for authored metadata, deliberately.** An `open` written on a `collapsible`
node is now a `tsc` error at the authoring site and an `invalid_type` refusal at the
key's own path on the zod mirror. `minor` rather than `major` because this repo's version
policy forbids `major` in any changeset (one `fixed` group) and records `minor` plus an
explicit breaking note as the spelling for a breaking change here.

**What actually changes for a document that wrote it.** The key was never inert, and the
card that filed it as inert had it backwards. `open` was never read as `schema.open`
anywhere — it rode `SchemaRenderer`'s non-metadata spread into the collapsible
registration's trailing `{...props}`, and because that spread is written last it beat the
`defaultOpen` written above it and made the Radix primitive CONTROLLED. Its other half,
`onOpenChange`, is refused by name (objectui#6124), so a JSON author could never supply
the handler a controlled primitive needs. Measured through the real renderer and the real
registry, both polarities: `open: true` rendered expanded and froze the trigger, and
`open: false` rendered collapsed and beat an explicit `defaultOpen: true`. After this
change the block runs on its own published `inputs` (`defaultOpen` / `disabled` /
`trigger` / `content` / `className`) and the trigger works again.

**The order is load-bearing and is not an implementation detail.** The renderer-side
exclusion lands FIRST and the retirement second, because the render path runs no
`safeParse` (objectui#9585 measured it NOT GATED). Retiring the declaration alone would
have deleted the author's only warning while leaving the takeover running — strictly
worse than doing nothing. Both halves are in this change; ⛔ neither is safe to remove
alone.

`defaultOpen` is the surviving spelling for the INITIAL state, and the refusal message
says so in those terms. It is ⛔ not offered as an equivalent for `open`: controlled state
needs a handler the schema cannot carry, which is a capability this vocabulary does not
have, not a spelling difference.

**Scope.** The exclusion is one key by name in the `collapsible` registration, ⛔ not a new
entry on `SchemaRenderer`'s global metadata strip list: `open` is a real live prop on
`dialog` / `sheet` / `popover`, which reach their primitives through that same channel and
are untouched here — asserted, not asserted-in-prose. `onOpenChange` keeps its runtime-slot
declaration and still rides the spread onto the Radix root, where it now fires for the
uncontrolled toggling this restores.

Executes the maintainer ruling recorded on objectui#8236 (director batch #144 item 4,
2026-09-17, verbatim 「9593 A,其他同意」): letter A, two steps, intercept before retire,
immediate retirement with no dual-spelling grace, and ⛔ no sibling sweep — objectui#6158,
objectui#5667 and objectui#4631 stay their own cards.
