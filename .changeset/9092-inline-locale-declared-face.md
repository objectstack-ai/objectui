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

**One runtime behaviour changes, at three sites.** `@object-ui/plugin-grid`'s
`ObjectGrid` put `schema.label` straight into three string positions — the
data-table caption, the export filename, and the record-detail overlay heading.
Restoring the declaration turned the first two into named compiler errors, which
is the audit the widening exists to produce: a map-valued label reached the
caption as an object and the export filename as `[object Object]`.

The third is the one a compiler cannot report, and it is worth knowing why. The
overlay heading goes through `t(key, options)`, whose options are
`Record<string, unknown>`, so the widening slips through an untyped sink and
nothing is flagged — while an unresolved map interpolates as the user-visible
heading `[object Object] Detail`, on the i18next path and on the provider-less
fallback alike. After a widening, `tsc` names the typed readers; the untyped
sinks (`t()` options, `String(…)`, template literals, `JSON.stringify`) have to
be found by hand.

All three now resolve through the spec's `resolveI18nLabel` against
`useDisplayLocale()`, matching the read sites that already did. Behaviour on the
string arm is unchanged, byte for byte. On the heading, a label that resolves to
nothing — an entry-less map, or an empty entry — falls through to the
`objectName` branch exactly as a missing label always did; testing the raw
`schema.label` could not do that, because every object is truthy.

⚠️ Not touched, deliberately: the **flat** `BaseSchema.ariaLabel`. It carries the
other vocabulary — objectui's keyed `{ key, defaultValue?, params? }` reference,
resolved by `resolveKeyedI18nLabel` — and objectui#4580 Q2-B withdrew the
`I18nLabel` spelling there as measured-wrong. The nested `aria.ariaLabel` widened
here is the inline form, which is what `@objectstack/spec`'s `AriaPropsSchema`
declares and what objectui#5134 made `ListView` resolve. The two object shapes are
structurally confusable to a reader, but **neither vocabulary admits the other**:
`InlineLocaleMapSchema` types its map with `key?: never; defaultValue?: never`,
and its `INLINE_LOCALE_KEY` pattern excludes both names, so writing one into the
other's slot is refused at `tsc` and at parse alike. (An earlier draft of this
note said each shape accepted the other vacuously — that was true when
objectui#4580 Q2-B wrote it, and the protocol has since closed it.) What a wrong
slot costs you is a wrong **answer** rather than a silent acceptance:
`resolveI18nLabel` hands a keyed reference back as its own `key` string. So still
check which resolver owns a slot before writing an object into it.
