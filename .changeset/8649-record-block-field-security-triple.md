---
'@object-ui/types': minor
'@object-ui/plugin-detail': minor
---

`record:details`, `record:highlights` and `record:related_list` declare the
field-security triple — `enforceFieldSecurity`, `redactFields` and
`requiredPermissions` — on their published types and registry inputs
(objectui#8649).

**This is a widening, and it is exactly the contract's.** `@objectstack/spec`
17.5.0 declares all three keys on these three blocks (objectstack#18159), with
the shapes `boolean`, `string[]` and `string[]`, each optional. The renderers
already honoured all three, reading them through a cast, while the published
surfaces said nothing about them. Both surfaces now accept what the
contract accepts, and nothing past it:

- **`@object-ui/types`** — `RecordDetailsComponentProps`,
  `RecordHighlightsComponentProps` and `RecordRelatedListComponentProps` gain
  `enforceFieldSecurity?: boolean`, `redactFields?: string[]` and
  `requiredPermissions?: string[]`. A document the contract accepts is no longer
  refused by `tsc` with `TS2353`; a wrong-typed value (a bare string for
  `requiredPermissions`, the string `'true'` for `enforceFieldSecurity`) is
  refused, as the contract refuses it.
- **`@object-ui/plugin-detail`** — the three blocks' registry `inputs` publish
  the three keys, so `sdui.manifest.json`, `sdui-intrinsics.d.ts` and the parser's
  prop walk stop treating them as unknown. Each input carries the contract's type
  (`boolean`, or `array` of `string`) and this block's own `.describe()` text
  from the spec, verbatim.

**No rendering, gating or masking behaviour moves.** The renderers read the
three keys without the cast now, so the reads carry the declared types; the
emitted JavaScript of all three renderers is byte-identical to before.
`requiredPermissions` is still the ADR-0066 capability gate (all named
capabilities held, or an insufficient-permissions notice takes the block's
place; fails open when the client cannot resolve capabilities), and
`redactFields` / `enforceFieldSecurity` are still presentation-only folds over
the block's own field or column list — none of them is a data-access control.

⚠️ This supersedes one paragraph of another pending note in the same release,
from this card's first half: it says these three keys are deliberately NOT
declared and routed to the producer. That was true against `@objectstack/spec`
17.4.0; the producer declared them in 17.5.0, and this entry is the result.
