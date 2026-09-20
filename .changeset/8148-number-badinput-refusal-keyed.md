---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

Key the `type="number"` bad-input refusal — the FIFTH sentence of this class,
and the only shared one — into the locale packs (objectui#8148).

objectui#6755 ruled that a widget's OWN refusal sentence goes through
`useFieldTranslation` + `FIELD_DEFAULTS`, and objectui#6888 applied that to
`LocationField`'s residue arm as the fourth. The four already keyed are each one
widget's. This one is not: a single literal in `widgets/numberBadInput.tsx`
produced the sentence for `NumberField`, `CurrencyField`, `PercentField` and
BOTH of `GeolocationField`'s boxes, through one hook, with five different
example values.

**The measured consequence is on the geolocation surface.**
`GeolocationField` sits beside `LocationField`, whose three refusal sentences
are all keyed, so on the same form two adjacent coordinate widgets refused bad
input in two different languages — a language switch mid-screen, which reads to
a user as a bug rather than as a missing translation.

**The example stays a HOLE, and that is the authoring decision this card had to
make.** Five different values reach the one sentence — `1234`, `1234.56`,
`12.5`, `30.2741` and `120.1551` — so keying the example per widget would have
meant five keys across ten packs, and each pack would then hold a decimal
numeral it could legitimately re-punctuate. A pack writing `1234,56` reads as
the `latitude, longitude` PAIR the adjacent widget's `fields.location.refusedFormat`
asks for. With `{{example}}` filled by the widget in ASCII, no pack spells a
digit at all, and all five values still reach the rendered sentence in every
language. That property is pinned by name.

**No behaviour moves.** The English value is byte-identical to the literal it
replaces, so English and provider-less rendering are unchanged — verified
through the rendered widget for all five boxes, under an `en` provider and with
no provider at all. objectui#6780's own announce suite keeps every verdict it
had; it now spells its expected English sentence locally, because the helper
that composes it takes the widget's `t` and reads
`fields.number.badInput` rather than building an English string on its own. The
guard still announces without refusing, and the new key is bound from here on by
`check:i18n-keys`, `check:i18n-drift` and `all-locales-key-parity` like its four
siblings.
