---
'@object-ui/types': minor
'@object-ui/plugin-tree': minor
'@object-ui/plugin-view': patch
'@object-ui/app-shell': patch
---

Derive `TreeViewConfig` from `@objectstack/spec` and drop `titleField`, the key the
protocol refuses on `ListView.tree` (objectui#8841).

**What was wrong.** `@object-ui/types` published `TreeViewConfig` as a hand-written
interface — a copy of the protocol's `ListView.tree` block under a second name — and the
copy declared a fifth key, `titleField`. `@objectstack/spec@17.4.0` refuses that key
there by name: `TreeConfigSchema` is a `strictObject` since spec #15469 closed the
`.passthrough()` window 17.3.0 left open. So this package's published face accepted what
the contract rejects, and an author who followed `@object-ui/types` was refused at
publish with `Unrecognized key(s) on this tree configuration: 'titleField'`. The copy was
invisible to `scripts/check-spec-symbol-derivation.mjs`, which matches spec symbols BY
NAME — a hand copy renamed away from the spec's symbol has nothing for its rule 1 to
match (objectui#4592's recorded blind spot).

**The grades, and why.**

- `@object-ui/types` — **minor**. `TreeViewConfig` is now
  `NonNullable<ListView['tree']>` from `@objectstack/spec/ui`, and `titleField` is
  removed from a **published** exported type. That is breaking for a producer that
  annotates a `tree` block carrying the key; per this repo's version-alignment policy
  (AGENTS.md — objectui's major tracks `@objectstack`'s) objectui's own breaking changes
  ship as `minor` with the breaking semantics stated here. The precedent is the same
  shape: `Remove the retired striped / bordered / virtualScroll list-view surface`
  (`@object-ui/types` 17.6.0, minor) propagated a spec-side retirement into this package
  the same way.
- `@object-ui/plugin-tree` — **minor**. `getTreeConfig`'s `labelField` chain loses its
  third rung, `?? schema.titleField`. That rung read the flattened **node**, never the
  block, and `titleField` is declared on neither face — not on `ObjectTreeSchema` (the TS
  interface or its zod mirror) and not on the protocol's `ListView.tree`. It is a runtime
  behaviour change, graded like one. The README's claim that this block is "the single
  declaration of that shape" is corrected in the same stroke: the protocol owns it, and
  this package publishes it derived.
- `@object-ui/plugin-view` — **patch**. `ObjectViewProps.views[n].tree` still resolves to
  `TreeViewConfig`; what it admits narrows with the type. Type-only, no runtime change.
- `@object-ui/app-shell` — **patch**. The console's `tree` composition keeps both rungs;
  only the second one's annotation changes (see below). No runtime change.

**The tolerant reads are kept, and deliberately left undeclared.** Three
`labelField || titleField` dual-reads survive — `plugin-view`'s and `plugin-list`'s
`'tree'` branches and the console's own composition in `app-shell` — so a view record
that already stores `tree.titleField` keeps resolving exactly as before, and
objectui#6557's pin on that rung stays green. They read through `any` now; the console's
canonical rung stays annotated `TreeViewConfig` while its legacy rung is not, because
casting it to a type that no longer carries the key cannot compile and re-declaring the
key locally would fossilise a renderer-side alias into a second contract — the AGENTS.md
#0.1 defect this change undoes. Retiring those three reads is a follow-up.

**Migration.** A host that writes `tree.titleField` should write `tree.labelField`, which
is the protocol's spelling and already wins wherever both are present. Nothing that
renders today stops rendering; what changes is that the key is now reported at compile
time by the same face that will refuse it at publish, instead of only at publish.
