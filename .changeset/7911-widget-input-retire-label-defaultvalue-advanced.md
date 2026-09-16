---
'@object-ui/types': minor
'@object-ui/core': minor
---

**BREAKING** (declared `minor` — this repo pins its major to `@objectstack`, so a
breaking change ships as a minor with this banner; AGENTS.md §版本号策略):
`WidgetInput.label`, `WidgetInput.defaultValue` and `WidgetInput.advanced` are
now ADR-0049 retirement tombstones (`?: never`). The published `.d.ts` member
set of `@object-ui/types` changes: all three keys stay DECLARED and become
UNWRITABLE, so TypeScript code that authors one on a widget-manifest input now
fails to compile.

The same three keys were retired on `ComponentInput` first (objectui#7493 /
objectui#7781). `WidgetRegistry.load()` — the only consumer of a manifest's
`inputs` in this repository — forwards `name`, `type`, `required`, `options`
(as `enum`) and `description`, and never these three; the seam copy that used to
carry them across went with that earlier retirement, leaving them declared and
unread on their own face. Maintainer ruling A of 2026-09-15 (objectui#7911)
carried the retirement to this second face, so the two input faces now agree.

**What to write instead:** nothing. An input is identified by its `name` on
every path that reaches it; `description` is the published place to tell an
author anything about it, including what the renderer's own fallback default is.

**The limit, stated because it is the whole cost of the change:** `WidgetInput`
has no zod mirror, so unlike the `ComponentInput` retirement this one has no
runtime face — it is a compile-time refusal and nothing else. A widget manifest
that arrives as JSON is not parsed through this type by anything in this
repository, so an author outside it who writes `label` gets what they got
before: the key is ignored, silently. Widget manifests are authored outside this
repository by design, and that population was never measured.
