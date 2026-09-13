---
'@object-ui/types': minor
'@object-ui/plugin-grid': patch
---

Group A of objectui#7759: three declarations restated a label key as a plain
`string` and now state the spec's inline locale map (objectui#9092).

objectui#4580's revised Q1 ruling (option A) widened the label keys to
`string | I18nLabel` — a plain string **or** an inline per-locale map like
`{ en: 'Accounts', 'fr-FR': 'Comptes' }`, resolved by the spec's own
`resolveI18nLabel(label, locale)`. `BaseSchema` obeyed it on both faces. These
three restated the key on top of it:

- `AppComponentSchema.label` (`app.ts`)
- `ObjectGridSchema.label` and `.description` (`objectql.ts`)
- `PageNodeSchema.aria.ariaLabel` (`layout.ts`)

A restatement on an interface that extends `BaseSchema` is a **narrowing
override**, so each of these refused the map its own zod mirror accepted. The
mirrors needed no change: the first three inherit the zod `BaseSchema`'s
`I18nLabelSchema`, and the page node receives the spec's `AriaPropsSchema` by
reference. The defect was therefore declaration-only, and it sat on the side a
forward mirror-vs-declaration comparison reads as clean — an author following the
published ruling was refused by `tsc` while `safeParse` said yes.

`ObjectViewSchema.table` is `Partial<Pick<ObjectGridSchema, …>>` and picks up the
same repair mechanically.

**One runtime behaviour changes.** `@object-ui/plugin-grid`'s `ObjectGrid` put
`schema.label` straight into two string positions — the data-table caption and the
export filename. Restoring the declaration turned both into named compiler errors,
which is the audit the widening exists to produce: a map-valued label reached the
caption as an object and the export filename as `[object Object]`. Both now resolve
through the spec's `resolveI18nLabel` against `useDisplayLocale()`, matching the
four read sites that already did. Behaviour on the string arm is unchanged.

⚠️ Not touched, deliberately: the **flat** `BaseSchema.ariaLabel`. It carries the
other vocabulary — objectui's keyed `{ key, defaultValue?, params? }` reference,
resolved by `resolveKeyedI18nLabel` — and objectui#4580 Q2-B withdrew the
`I18nLabel` spelling there as measured-wrong. The nested `aria.ariaLabel` widened
here is the inline form, which is what `@objectstack/spec`'s `AriaPropsSchema`
declares and what objectui#5134 made `ListView` resolve. The two object shapes are
structurally confusable and each accepts the other vacuously, so check which
resolver owns a slot before writing an object into it.
