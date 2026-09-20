---
'@object-ui/types': patch
---

Derive the zod mirror's user-filter FIELD shape from `@objectstack/spec` instead of
re-declaring it, and record the user-filter CONTAINER as a declared dialect
(objectui#7265, the `@object-ui/types` slice of the spec-symbol burn-down).

`zod/objectql.zod.ts` declared two schemas under names `@objectstack/spec/ui`
already exports. They were triaged separately, by reading their sites, and went
different ways.

**`UserFilterFieldSchema` is now derived.** `field`, `type`, `showCount` and
`defaultValues` flow in from the spec by reference, so the day the protocol grows
a key or a control type this mirror tracks it instead of drifting. Two divergences
are kept, confined to the members that carry them and documented at the
declaration: `label` stays a plain string (`@object-ui/plugin-list` renders it as
a React child, so the spec's i18n union arm would reach JSX as an object), and
`options[]` keeps this package's element for the same reason on its own `label`.
The object's strip posture is restored explicitly with `.strip()` rather than
inheriting the spec's `.strict()`.

**No metadata changes meaning.** The accept set is unchanged in both directions —
the same documents validate, and each one parses to the same result. What moves in
the published artifact is provenance and documentation: the four derived members
now carry the protocol's own `.description` text instead of this package's
paraphrase of it.

**`UserFiltersSchema` stays a local dialect**, and now says so where a reader can
check it. Three divergences keep it unbindable: `element` is required here and
refuses the spec's `toggle` (ADR-0053, while the spec keeps `toggle` in its own
enum so shipped configs keep rendering), `tabs` carries this package's legacy
`{ id, filters, default }` preset shape that the spec's strict tab schema rejects
and `normalizeTabPresets` still normalises at runtime, and the container strips
unknown keys where the spec's rejects them. Binding it would reject metadata that
renders today, so it is waived in the derivation gate's ALLOW map with that reason
rather than left untriaged.

Both routes are pinned, in both directions, by
`packages/types/src/__tests__/spec-symbol-parity.test.ts` and
`scripts/__tests__/spec-symbol-ledger-types-7265.test.ts`, so a re-fork of the
derived name, or a waiver that outlives its divergence, fails rather than goes
quiet.
