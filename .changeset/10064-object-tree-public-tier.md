---
'@object-ui/core': minor
---

feat(core): `object-tree` joins the curated public tier — the spec declared the block, the roster withheld it

`@objectstack/spec` declares `object-tree` on `ComponentPropsMap`, and
`@object-ui/plugin-tree` has registered the renderer all along. The curated
`PUBLIC_BLOCKS` roster — the one face that decides the ADR-0080 public tier —
carried no tree name, so `getPublicConfigs()` reported the block as outside the
contract. The tier was NARROWER than the declaration.

That absence reached everything downstream, and nothing downstream could repair
it. `getPublicConfigs()` is the read both manifest producers serialize through
`manifestFromConfigs` (`apps/console/dev/manifest-dump.tsx`, and the framework's
node generator for its tracked `sdui.manifest.json`), so the published manifest
and the generated JSX intrinsics could not carry a block the contract says
exists — regenerating them was a no-op, and moving the objectui pin could not
help while the pinned source had nothing to carry.

**What moves for a user.** `object-tree` is now part of the AI-authoring
vocabulary and of the generated manifest and intrinsics, and it joins the
`kind:'react'` page scope as `ObjectTree` (that scope is built from the same
public configs, minus declared containers; this block declares no containment).
The renderer, its props and every existing schema are untouched: nothing that
rendered before renders differently, and no key changes meaning.

**What deliberately does not move.** The same module registers this renderer a
second time under the bare `tree` alias, and that spelling stays out: the spec
declares no such key, so curating it would widen the vocabulary past the
declaration rather than pull the tier back to it, and two names for one block is
ambiguity an authoring model cannot resolve — the ground `record:chatter` is
held out on.

The admission is a roster entry, not a `tier: 'public'` flag on the
registration. Both routes reach `getPublicConfigs()`; the siblings
(`object-grid`, `object-map`, `object-gantt`, …) all take the roster, no
published registration in this repo declares the flag, and the roster's own
header asks callers to prefer the list over scattered flags.
