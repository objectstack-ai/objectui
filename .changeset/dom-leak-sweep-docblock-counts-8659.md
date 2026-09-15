---
---

Test-only change (objectui#8659): the `packages/app-shell` DOM-leak sweep now
asserts the counts its own docblock quotes — re-derived from
`COMPONENTS_PLAIN_TYPES`, `COMPONENTS_SPECIAL_TARGETS` and
`COMPONENTS_LEAK_GROUPS`, and read back out of the file's own prose. Nothing
published moves: the only file touched is `src/__tests__/**`, and
`@object-ui/app-shell` publishes `dist`, `src/styles.css` and the metadata
files, none of which contains it.
