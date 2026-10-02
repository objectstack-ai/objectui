---
'@object-ui/i18n': patch
---

fix(i18n): every count plural family carries every plural form its language uses (objectui#11432)

The 14 i18next count plural families (`console.ai.usage.resetsWeeklyHours`,
`detail.fileCount`, `perm.facet.objects` and the rest) held `_one`, sometimes
`_other`, and a base key. i18next asks `Intl.PluralRules` for the one suffix a number
needs, and where a pack lacked that slot the base key answered with its single
string. So `ru` read "Сброс через 3 часов" on the AI usage indicator where Russian
needs "часа", and `ar` served 0, 2, 3-10 and 11-99 from one "singular(plural)"
marker.

Every pack now spells out every CLDR category its language selects: `_other` where
the base stood in for it, `ru` `_few`/`_many`, `ar` `_zero`/`_two`/`_few`/`_many`,
and `fr`/`es`/`pt` `_many` (exact millions, "1000000 de fichiers"). Existing slots
whose form was wrong for their own category are corrected: `ar` `_other` (100-102…)
now holds the singular, `ru` `_other` (fractions) the genitive singular, and the four
`ru` `perm.facet.*` `_one` forms agree with the numeral like the new slots. English
and the `de`/`zh`/`ja`/`ko` strings a user sees do not change.

`all-locales-key-parity.test.ts` now computes each family's required slots from
`Intl.PluralRules` per pack, so a new family or a new pack that misses a category
fails at PR time, and the parity rule admits a key `en` lacks only when it is such a
slot.
