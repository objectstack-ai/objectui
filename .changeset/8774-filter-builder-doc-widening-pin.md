---
---

Test-only: `packages/types/src/__tests__/filter-builder-mirror-6939.test.ts`. It sits
under `src/`, so the presence gate counts it, but nothing published moves — the
package's build `tsconfig.json` excludes `**/__tests__/**` and its `files` list is
`["dist", "README.md", "CHANGELOG.md", "LICENSE"]`, so the file never reaches a
consumer. Declared as releasing nothing.

objectui#8774: after objectui#7562 the published doc
(`content/docs/components/complex/filter-builder.mdx`) is the AUTHORITY for the
`filter-builder` authoring surface, but the pins bound the enum to a hard-coded
`DOCUMENTED_FOURTEEN` constant and the doc-reading pin asserted only doc ⊇ fourteen.
So the doc NARROWING reddened and the doc WIDENING reddened nothing — and widening is
the direction objectui#7562 came from.

The population is now taken FROM the doc (`documentedTypes()` parses the `type?:` union
out of the doc's `interface FilterField` block) instead of copied beside it, so `the
accept set is EXACTLY the published doc` compares the enum against the authority and
fails in both directions. A doc-seeded pin can go vacuous the moment its reader stops
matching, so every reader throws on absence, and a floor test drives both throws with
the doc's own two-member `logic` union as its positive control.

⛔ No accept set moves: doc and mirror were measured to agree on all fourteen members
before and after (14 = 14, no divergence in either direction).
