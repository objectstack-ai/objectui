---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

Full-page search results now read correctly in Russian and Arabic at every
count (objectui#10024).

The results line picks `search.resultsCount` at exactly one result and
`search.resultsCountPlural` at every other count. Two slots cover English; they do
not cover Russian, which needs three noun forms for whole numbers, or Arabic, which
needs more. Russian's second slot held the form for 5 to 20, so two results read
`2 результатов` (the language needs `2 результата`) and twenty-one read
`21 результатов` (it needs `21 результат`). Arabic's two slots were the same string
byte for byte, so the switch gave Arabic nothing at 2 or at 3 to 10.

In both packs the count-not-one half is now a count label that reads correctly at
any number: `Результатов по запросу "…": N` and `عدد نتائج البحث عن "…": N`. That is
the device both packs already use where two slots are all there are — Russian's
`collaboration.commentCount` (`Комментариев: N`) is the same shape on the same
two-key convention. The singular half, the call site, the key set and the other
eight packs are unchanged; `zh`, `ja` and `ko` keep one string in both halves
because their languages have a single plural category.
