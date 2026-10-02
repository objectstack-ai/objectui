---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's record-count footer, drawn under the list when a record is open
beside it in split navigation, now reads `1 record` at one record instead of
`1 records` (objectui#10636).

The footer rendered one key, `console.objectView.recordCount`, at every count.
It now picks the new `console.objectView.recordCountOne` at exactly one record
and `console.objectView.recordCount` at every other count, the same switch the
list view's record-count bar uses. Every built-in pack words the pair the way it
words the list bar's `list.recordCount` / `list.recordCountOne`, so the footer
and the bar count the same records in the same words. In Japanese, Korean and
Chinese, which have no separate singular, the two values are the same string.

Russian and Arabic also read correctly at other counts now. The count-not-one
value held one noun form: Russian read `2 записей` at two and `21 записей` at
twenty-one, and Arabic used the singular noun at every count. Both now use the
count label their list bar already uses, `Записей: N` and `عدد السجلات: N`,
which is right at any number. At one record they read `1 запись` and `1 سجل`.

⚠️ **Dated note, 2026-10-02 — superseded in this release — objectui#11445.**
Later in this same release the `console.objectView.recordCountOne` /
`console.objectView.recordCount` switch gave way to a
`console.objectView.recordCount` count family in all ten packs, worded like
`list.recordCount`'s: the footer calls the family key with `{ count }`,
`console.objectView.recordCountOne` left every pack, and `ru` and `ar` read a
noun form at each count (`2 записи`, `3 سجلات`) where the count label stood. The rest of this entry is kept as the reading of this change.
