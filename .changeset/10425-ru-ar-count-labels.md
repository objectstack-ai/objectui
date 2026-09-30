---
'@object-ui/i18n': patch
---

Russian now reads correctly at every count on the list view's record-count bar,
and Arabic on that bar, the record picker's count, the activity-feed reaction chip,
the presence avatars' accessible name and overflow tooltip, and the full-page
search count while browsing (objectui#10425).

Each of these surfaces picks its `…One` key at exactly one and the plain key at
every other count. Where the plain key held a single noun form, it was wrong at
some of the counts it serves. The Russian record-count bar read `2 записей` at two
(the language needs `2 записи`) and `21 записей` at twenty-one (it needs
`21 запись`). The Arabic values each held one noun form (the plural for three to
ten, or in `lookup.recordCount` the singular), while Arabic needs different forms
at two, at three to ten and from eleven up.

The count-not-one half of these seven values is now a count label that reads
correctly at any number:

- `ru` `list.recordCount`: `Записей: N`
- `ar` `list.recordCount`: `عدد السجلات: N`
- `ar` `lookup.recordCount`: `عدد السجلات: N`
- `ar` `detail.reactionCount`: the emoji, then `عدد التفاعلات: N`
- `ar` `collaboration.presentUserCount`: `عدد المستخدمين المتواجدين: N`
- `ar` `collaboration.moreUserCount`: `عدد المستخدمين الآخرين: N`
- `ar` `search.itemsAvailable`: `عدد العناصر المتاحة: N`

That is the device objectui#10024 and objectui#10242 used, and the one Russian's
`lookup.recordCount` already uses. The singular halves, the key set, the call sites
and the other eight packs are unchanged.
