---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Build history rows now state their item count in each language's own grammar
(objectui#9266).

The commit timeline composed the count by concatenation — the row rendered the
number itself and then asked the locale pack for a bare unit word to sit beside
it. A pack that never sees the number cannot agree with it, so, measured through
a real render at one item, six of the ten packs read `1 Elemente`,
`1 éléments`, `1 elementos`, `1 itens`, `1 элементов` and `1 عناصر`.

`preview.history.items` now carries the count itself, one interpolated value per
pack, and the call site passes `count` instead of printing the digit beside the
translation. Each pack states the quantity in an idiom whose grammar does not
bend on the number: `de` / `fr` / `es` / `pt` / `ru` / `ar` take the label-colon
form (`Elemente: 3`, `Элементов: 3`), which is what
`fields.textarea.charactersRemaining` already uses for this same reason.

`en`, `zh`, `ja` and `ko` render exactly what they rendered before, at every
count — the three CJK packs because their grammar marks no plural, and `en`
because its value already carried the count-invariant `(s)` marker. No copy that
was correct has been changed.

A real `_one` / `_other` plural family was measured and not adopted: identical
key sets across the ten packs leave `ru` without `_few` and `ar` without
`_two` / `_many`, so those categories fall through to the base key and `ru` would
still read `2 элементов` — wrong at the counts a build history shows most often.

The count is kept. Dropping the number (the route taken for `kanban.columns`,
where the lanes are visible anyway) would delete information here rather than
de-duplicate it.
