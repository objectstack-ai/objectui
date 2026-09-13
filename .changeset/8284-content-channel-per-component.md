---
'@object-ui/types': minor
---

Resolve the `body` / `children` duality PER COMPONENT: twelve component schemas now
narrow to the content channel their renderer actually reads and tombstone the other on
both published faces (objectui#8284, maintainer ruling summon #17 decision batch #2,
2026-09-07).

**BREAKING for authored metadata, deliberately** — and `minor` because this repo's
fixed version group never ships `major` (see AGENTS.md 版本号策略).

`BaseSchema` declares two optional content channels and its own docblock admits that
"some components use `children` instead of `body`" without saying which. The zod base is
`.passthrough()` and both keys are optional, so a node carrying the wrong channel
type-checked, parsed green, was preserved by the parse — and then rendered an EMPTY
element. No error at authoring time, none at validation time, none at render time. Seven
earlier cards repaired one page of that each (objectui#5027, #3900, #6773, #6806, #8197,
#8234, #6939) before the declaration itself was named.

**What changes.** For each component below, the channel its renderer does not read is now
`?: never` on the TypeScript face and refused BY NAME on the zod mirror, with a message
that names the channel to write instead:

| the renderer reads | components | now refused |
|---|---|---|
| `children` | `box`, `span`, `container`, `flex`, `stack`, `grid`, `scroll-area`, `form`, `toggle` | `body` |
| `body` | `alert`, `badge`, `tooltip` (which reads `content` first, `body` as its fallback) | `children` |

Which channel each renderer reads was measured with the TypeScript type checker over
every `ComponentRegistry.register(...)` call in `packages/components` — a read site is a
property access filed under the type of the object it is read from, so a docblock mention
cannot score. The full 114-row table, including the components deliberately NOT narrowed
here, is on objectui#8284.

**Migration.** Nothing that renders today stops rendering: a document authoring the
channel its renderer reads is unchanged, and a document authoring the other one rendered
an empty element before and is now refused instead. The repo-wide census found five
documents in this state — `packages/react/README.md`, `content/docs/guide/expressions.md`,
two blocks in `content/docs/guide/schema-rendering.md` and `packages/components/TESTING.md`
— every one of them a `form` or `container` authoring `body`; all five are corrected in
this change. If your own metadata authors the refused channel on one of these twelve node
types, the component was already drawing nothing there; rename the key to the one in the
table.

**Not narrowed here, and why.** Components whose renderer reads BOTH channels through a
live `children || body` fallback (`div`, `card`, `button`, `aspect-ratio`, the `page`
family), components that read neither, and components with no dedicated declaration
(`sidebar-*`, the `any`-typed registrations) keep both channels. Each is named on
objectui#8284 with the specific measurement it still needs; acting on any of them from the
`packages/components`-only sweep would have been a guess.
