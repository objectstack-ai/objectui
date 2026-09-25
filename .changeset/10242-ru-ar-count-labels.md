---
'@object-ui/i18n': patch
---

Russian now reads correctly at every count on the tab-count badge's accessible
name and the activity-feed reaction chip, and Arabic on the badge and the comment
thread's count and reaction tooltip (objectui#10242).

Each of these surfaces picks its `…One` key at exactly one and the plain key at
every other count. Two slots cover English. They do not cover Russian, which needs
three noun forms for whole numbers, or Arabic, which needs more. Where the plain key
held a single noun form, it was wrong at some of the counts it serves. A Russian tab
badge read `2 элементов` at two (the language needs `2 элемента`) and
`21 элементов` at twenty-one (it needs `21 элемент`), and a Russian reaction chip
read `2 реакций` at two. The Arabic badge, comment count and reaction tooltip used
the plural form for three to ten, which is wrong at two and from eleven up.

The count-not-one half of these five values is now a count label that reads
correctly at any number:

- `ru` `common.itemCount`: `Элементов: N`
- `ru` `detail.reactionCount`: the emoji, then `Реакций: N`
- `ar` `common.itemCount`: `عدد العناصر: N`
- `ar` `collaboration.commentCount`: `عدد التعليقات: N`
- `ar` `collaboration.reactionCount`: `عدد التفاعلات: N`

That is the device objectui#10024 used for `search.resultsCountPlural`, and the one
Russian's `collaboration.commentCount` and `collaboration.reactionCount` already
use. The singular halves, the key set, the call sites and the other eight packs are
unchanged.
