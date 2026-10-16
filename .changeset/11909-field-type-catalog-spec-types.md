---
'@object-ui/app-shell': patch
---

Studio's field type catalog now holds every field type the spec declares: it gains `user`,
`secret` and `record` (objectui#11909).

- A field of one of these types reads its type's name in the field inspector's Type control,
  where it read "(not found)".
- The Type control and the canvas's *Add field* palette offer all three: **User** under
  Relation, **Secret** under Text, and **Record Map** under Advanced, each with an icon and a
  one-line description, in English and Chinese.
- Adding one writes just its type and label. A `user` field needs no target: the spec fixes
  it to users.

The catalog's type list is now the spec's own `FieldType`, so a field type the spec adds later
cannot go missing from Studio unnoticed.
