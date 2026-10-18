---
"@object-ui/plugin-detail": minor
"@object-ui/types": minor
---

A `record:details` section heading can show how many values a field holds (objectui#12192).

A section that declares `count: { field }` (`@objectstack/spec` 18, `RecordDetailsProps.sections[].count`) now has the `{{ count }}` hole in its heading filled with the number of values that field holds on the current record: `{ name: 'tagging', label: '{{ count }} tags', count: { field: 'tags' }, fields: ['tags'] }` reads `3 tags` when three tags are selected. The hole grammar is the spec's exported `SECTION_HEADING_COUNT_HOLE`.

- An absent or empty value counts 0. A field the viewer may not read counts as absent.
- The hole is filled after the heading is translated, so each locale of an inline label map and a translated `objects.OBJECT._sections.NAME.label` entry write the same `{{ count }}`.
- `count` changes the heading only. Whether the section renders is unchanged: with `hideEmpty` on (the default), a section whose fields are all empty is still absent.
- A section without `count` prints its heading exactly as written, including a literal `{{ count }}`.

`RecordDetailsComponentProps.sections[]` in `@object-ui/types` now declares `count?: { field: string }`, so a typed section literal carrying it compiles.
