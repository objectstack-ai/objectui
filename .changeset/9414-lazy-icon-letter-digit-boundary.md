---
'@object-ui/components': patch
---

Teach the icon seam's tokeniser the `letter -> digit` boundary (objectui#9414).

`toKebabIconName` split `lower-or-digit -> Upper` and `acronym-run -> Word`, and never
`letter -> digit`. So `Building2` — the PascalCase component `lucide-react` exports, the
spelling lucide's own site shows an author, and the spelling an author copies — tokenised
to `building2` while lucide's canonical key is `building-2`. The name matched nothing and
`getLazyIcon` degraded it to the `Database` glyph with **no error, no warning and no log**:
the author saw *an* icon and had no signal that it was not theirs. Every digit-bearing
canonical name was affected — `BarChart3`, `CheckCircle2`, `ArrowDown01`, `Axis3D`,
`Grid2x2` and the rest.

One rule closes it, and it is deliberately not unconditional. A negative lookbehind holds
the split off when the letter is itself preceded by a digit, because that is lucide's grid
spelling: `Grid2x2` is the Pascal form of `grid-2x2`, where the `x` sits *inside* a segment
rather than starting one. That is what lets the same single rule land on lucide's primary
`grid-2x2` instead of its `grid-2-x-2` alias, and it is why `Grid3x2` — for which lucide
ships no `-3-x-2` alias at all — is reached too.

**Nothing that resolved before resolves differently.** The change is a strict superset:
every name the previous tokeniser accepted still tokenises to the byte-identical result,
and every canonical kebab spelling is still returned untouched. Both legs, and the
capability itself, are re-derived from the installed `lucide-react` on every run by
`packages/components/src/__tests__/lazy-icon-digit-boundary-9414.test.ts` rather than
written down here — the property pinned there is that **every** canonical icon name is
reachable from its own exported PascalCase spelling.

**Correction to an earlier migration note.** The changeset for objectui#7472 lists
"digit-suffixed spellings such as `Building2`" among lucide's *alias* forms that stopped
resolving, alongside the `HouseIcon` suffix and `LucideHouse` prefix shapes. The two alias
shapes are correctly described; `Building2` never belonged with them. It is a canonical
spelling, not an alias — `building-2` is a live key of lucide's dynamic surface, and only
this tokeniser could not reach it. Authors who moved off `Building2` on that advice lost
nothing (`building-2` is the same icon), but the spelling itself was never the problem and
works again.

Released behaviour of `getLazyIcon`, `isLucideIconName` and `LazyIcon` for a name lucide
genuinely does not have is unchanged: it still degrades rather than throwing.
