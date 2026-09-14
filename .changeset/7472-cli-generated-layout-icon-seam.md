---
'@object-ui/cli': patch
---

Route the generated app layout's icon lookup through the platform seam (objectui#7472).

`objectui dev`/`init` emit a `src/Layout.tsx` into the user's application, and that
template carried its own lucide resolver: `import * as LucideIcons from 'lucide-react'`
feeding `lucideIcons[name]`, with **zero** normalisation. It was the last container in
the platform still resolving icon names for itself, which objectui#5935's ruling
forbids — and because the file is generated, the vocabulary it accepted became an
authoring contract that held inside a generated app and nowhere else.

The layout now imports `LazyIcon` and `isLucideIconName` from `@object-ui/components`
(already one of its declared dependencies, so nothing new is installed) and asks the
predicate first, preserving the old "render no glyph for an unresolvable name"
behaviour rather than falling back to the seam's stray database icon. The four
statically-referenced icons move from the namespace object to named imports, so the
wildcard import — the pattern that used to pull ~1500 icons into a bundle — is gone
from generated apps entirely.

**Migration, measured rather than assumed.** Icon names are now normalised, so the
accepted vocabulary changes in both directions:

- Canonical `PascalCase` names (`Flame`, `House`, `ChevronsUpDown`) keep working —
  converting exactly those is what the seam's tokeniser is for. 1,882 of them.
- `kebab-case` names now work too. Every other container in the platform already
  accepted them; a generated app silently rendered nothing. 2,039 names gained.
- lucide's **alias** spellings no longer resolve: the `HouseIcon` suffix form (2,037),
  the `LucideHouse` prefix form (2,036), and digit-suffixed spellings such as
  `Building2` (147). These were never `icons` keys, so they resolved only inside a
  generated app. An `app.json` using one should switch to the canonical spelling —
  `House`, or `building-2`.
