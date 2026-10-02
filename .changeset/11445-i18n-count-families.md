---
'@object-ui/i18n': patch
---

Count labels read the right noun form in every language at every count: each label a word must agree with is now an i18next count family in all ten packs (objectui#11445).

**What was wrong.** objectui#11432 gave every count family every CLDR category its language selects. Two other spellings of the same defect sat outside that rule. Fifteen labels were code-selected pairs (`detail.attachmentCount` / `detail.attachmentCountPlural`, `common.itemCount` / `common.itemCountOne`, and thirteen more): the component chose between two keys on `=== 1`, which gives a language two forms, so Russian read `3 вложений` and Arabic `2 مرفقات`. Fifty-three labels were one string at every count, so Russian read `Согласовать 3 запросов?`, Arabic `منذ 5 دقيقة`, Spanish `1 seleccionados` and English `3 row modified`.

**What changes.** Each of those 68 keys is a family: `en` `_one` / `_other`, `ru` `_one` / `_few` / `_many` / `_other`, `ar` all six categories, and each other pack the categories its language selects. The base key keeps its value and answers a call made without a count.

**Removed keys.** The fifteen code-selected siblings leave all ten packs: `lookup.recordCountOne`, `common.itemCountOne`, `list.recordCountOne`, `detail.reactionCountOne`, `detail.attachmentCountPlural`, `detail.replyCountPlural`, `console.objectView.recordCountOne`, `search.resultsCountPlural`, `search.itemsAvailableOne`, `ai.formAssist.suggestionCountOne`, `ai.formAssist.appliedCountOne`, `collaboration.commentCountOne`, `collaboration.reactionCountOne`, `collaboration.presentUserCountOne` and `collaboration.moreUserCountOne`. A host that looked one up itself now gets the key back instead of a label: call the family key with `{ count }` instead (`t('detail.replyCount', { count: n })`), and i18next picks the form.

**Provider-less fallback.** `createSafeTranslation` now reads a count family's `_one` / `_other` row for a numeric `count` before the base row, in the order i18next reads the `en` pack, so a host with no `I18nProvider` keeps rendering "1 reply" / "3 replies". A string `count` still reads the base row, as it does in i18next.

**Supersedes, in this release.** The notes for objectui#9664, objectui#10024, objectui#10242, objectui#10425 and objectui#10636 describe the `…One` / `…Plural` switch these families replace; each now carries a dated note saying so. Their `ru` / `ar` count labels (`Записей: N`, `عدد السجلات: N`) stay only on the base key, which answers a call made without a count.

**Pinned.** `count-families-11445.test.ts` fails on any `…Plural` key in a pack and on any `{{count}}` value outside a family unless its count-neutral list names the key with the reason no word agrees with the number.
