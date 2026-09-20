---
'@object-ui/components': minor
'@object-ui/fields': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-kanban': minor
---

fix(components): Tailwind no longer compiles this package's prose into the published stylesheet

`@object-ui/components`' Tailwind entry opened with a bare `@import 'tailwindcss'`
— the only one of this repository's four stylesheet entries without a
`source(none)` pin. Tailwind v4's automatic source detection was therefore ON,
and it roots at the PROCESS working directory, so it scanned every non-ignored
file in the package: `CHANGELOG.md`, `README.md`, the markdown beside the
renderers, `shadcn-components.json`, even an English sentence in a comment inside
`tsconfig.test.json`. Every class-shaped token in that prose compiled into a real
rule in the published `dist/index.css`.

The entry now reads `@import 'tailwindcss' source(none);`. It keeps the FULL
Tailwind import, because this is the root sheet: preflight, the `@theme` block
and the base layer are emitted exactly as before. Only automatic detection is
off, so the entry's own `@source` lines are the whole input set — and the
compiled sheet is now byte-identical whatever directory the build is launched
from, which it previously was not.

## Breaking: 23 prose-derived utilities leave `@object-ui/components/style.css`

None of these is emitted by any component under this package's `src`; each one
existed solely because some prose in the package mentioned it. Grouped by the
file that was creating it:

- from `CHANGELOG.md` — `cursor-not-allowed`, `flex-shrink-0`, `lg:p-8`,
  `md:text-2xl`, `origin-[--radix-...]`, `pb-20`, `scale-0`, `sm:px-6`,
  `sm:py-4`, `space-y-8`, `w-[--sidebar-width]`, `xl:flex`
- from `README.md` — `bg-blue-500`, `hover:bg-blue-700`, `text-white`
- from `README_SHADCN_SYNC.md` — `dark:backdrop-blur-sm`, `dark:bg-background/95`
- from the JSON examples in the renderer docs — `bg-blue-50`, `bg-gray-50`,
  `h-[600px]`, `h-[800px]`
- from `shadcn-components.json` — a variant of `origin-[--radix-` ending in a
  typographic ellipsis
- from a prose comment in `tsconfig.test.json` — `invert`, which is an ordinary
  English word there

Two of them are worth calling out. `flex-shrink-0` is a deprecated Tailwind v3
alias this repository deliberately migrated away from, and it was shipping only
because the changelog entry announcing that migration names it.
`w-[--sidebar-width]` and the `origin-[--radix-` pair are the v3 bracket syntax,
shipping only because the changelog entry recording the move to v4 syntax quotes
the old spelling. A consumer who had come to rely on any of the 23 should add it
to their own Tailwind sources; they were never this package's to publish.

## Fixed: three sibling packages get back classes their own components emit

The plugin stylesheets subtract every rule `@object-ui/components` already
ships, so any class the prose invented was subtracted out of THEIR sheets while
their components still emitted it — under-styled published packages with a green
build. Restored by this change:

- `@object-ui/plugin-kanban` — `h-[600px]`, `sm:px-6`, `sm:py-4`
- `@object-ui/plugin-grid` — `bg-blue-50`, `cursor-not-allowed`
- `@object-ui/fields` — `bg-blue-50`, `bg-blue-500`, `bg-gray-50`, `text-white`

The same mechanism was also a loaded gun for the release lane: `changeset:version`
writes changeset bodies into `packages/components/CHANGELOG.md`, so a changeset
that merely QUOTED a class name promoted it to a real utility in this sheet and
stripped it out of the plugin sheets at the next release. That is no longer
possible for these four packages — which is why this body can safely quote 23
class names.

## Why `minor` rather than `patch`

Removing utilities from a published stylesheet is a contraction of a published
artifact, so it carries a breaking semantic. This repository does not ship
`major` outside the `@objectstack` major-sync release, and marks its own breaking
changes `minor` with the break spelled out — which is what the section above is.
