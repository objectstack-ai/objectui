---
'@object-ui/types': minor
---

`InputShorthandSchema` (and its TS twin) now REFUSES `inputType` on the `email` / `password`
node shorthands BY NAME and points at `{ "type": "input", "inputType": "email" }` — the
spelling that is actually read (objectui#8762).

⚠️ Shipped as `minor`, not `patch`, because this is a NARROWING of a published accept
surface, and the precedent it follows is objectui#7694's named alias refusal, which says the
same thing in the same words. (`major` is not available: AGENTS.md §版本号策略 keeps this
repository's major aligned with `@objectstack`, so objectui's own breaking changes ship as
`minor` with the breaking semantics spelled out in the body — mechanically enforced by
`scripts/check-changeset-no-major.mjs`.)

- **Before:** `{ "type": "password", "inputType": "text" }` validated green, and the renderer
  drew a MASKED field anyway. `packages/components/src/renderers/form/input.tsx` registers both
  shorthands by wrapping the `input` renderer and spreading its own `inputType` LAST, so the
  authored value was overwritten before the renderer read it. `BaseSchema` is `.passthrough()`,
  so the key even survived into `safeParse`'s output. Nothing anywhere said so.
- **After:** the same document is refused at `path: ['inputType']` with guidance naming the
  key, the reason, and the spelling to write instead. One string feeds both the parse-time
  message and `.describe()`, so the generated docs cannot drift from the error.

**What is NOT changed, and was measured to make sure:**

- `{ "type": "input", "inputType": "…" }` — the honoured spelling and the one the guidance
  points at — parses and renders exactly as before, at every value.
- `{ "type": "email" }` / `{ "type": "password" }` without the key are untouched, and every
  other key on the arm is still judged.
- A form FIELD is a different position with the opposite precedence: inside `fields: [ … ]`,
  `{ "name": "contact", "type": "email", "inputType": "text" }` still renders a text box, and
  this refusal does not reach there. The message says so, and the sentence is pinned.
- ⛔ The wrapper's precedence is deliberately NOT flipped. Letting an authored `inputType` win
  would render `{ "type": "password", "inputType": "text" }` as an UNMASKED field under a
  `password` key — a secret in clear text, which is worse than refusing the key.

**Who this can break.** Any document authoring `inputType` on an `email` / `password` node
stops validating — that is the defect surfacing, not collateral damage, since the value never
did anything. A census of every corpus in this repository found NONE: over 546 parsed JSON
documents plus every fenced JSON block in `content/**` and the package READMEs, six nodes
carry a shorthand `type` and not one of them authors `inputType`. The `hotcrm` and
`objectstack` corpora are outside this repository and were NOT measured.
