---
---

Test-only: pin the member shapes `object-grid` reads inside its four per-ROW
keys — `rowColor`, `conditionalFormatting`, `operations` and `rowActions` —
and move `MEMBER_PIN_EXEMPTION_CEILING` 24 -> 20 in step (objectui#8071).

No published behaviour changes. Measured from a build rather than assumed: the
new and grown files are `*.test.tsx` under `src/`, and every symbol they
introduce reads 0 in both affected packages' published corpora (the paths their
`package.json` `files[]` ships), against lit controls from published source in
the same corpora — `useRowColor` 10 and `resolveLegacyRowActions` 8 in
`@object-ui/plugin-grid`, `ConsolePlugin` 12 and `data-boot-theme` 6 in
`@object-ui/console`. The one hit for the string `registry-inputs-spec-parity`
in the console corpus is a docstring inside the vendored `@objectstack/spec`
chunk naming the file; it is a mention, not these bytes, and it is there
unchanged without this commit.
