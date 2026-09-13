---
'@object-ui/components': minor
---

Take lucide's runtime `icons` record off the console's eager path (objectui#9251,
maintainer ruling of 2026-09-13, decision batch #132 item 4).

`resolveIcon` — the single icon-name seam every renderer in this stack goes
through — answered "is this a legal icon name, and which glyph is it?" by
indexing lucide's `icons` record. A namespace object has no dead members, so
that one index pulled **every** icon module into the bundle that holds
`@object-ui/components`: 1,781 icon module definitions, measured in the
console's `ui-components` chunk.

**What changed.** Membership now comes from a static list generated at build
time from lucide's own export manifest
(`scripts/regenerate-lucide-record-icon-names.mjs`), and the glyph is fetched
through lucide's dynamic-import map. Nothing that ships imports the record for a
value any more.

**The accepted vocabulary is unchanged.** It is still the record's keys and
deliberately not `lucide-react/dynamic.mjs`'s `iconNames`, which is a strict
superset carrying 258 spellings lucide retired (`edit`, `smile`, `filter`,
`alert-triangle`). A name that resolved before resolves now; a name that
returned `null` before returns `null` now, in the same tick — so the four
different things call sites draw for an unresolvable name are untouched.

**What a consumer can observe.** The `<svg>` is emitted synchronously, with
lucide's own classes (`lucide`, `lucide-house`, and for the 95 digit-bearing
names both spellings, e.g. `lucide-trash2 lucide-trash-2`), box, attributes and
your `className`. Its `<path>` children arrive when the icon's own chunk lands.
Selecting or styling by `svg.lucide-<name>` keeps working on the first frame;
a test that asserts on the path data inside the svg now has to await it.
