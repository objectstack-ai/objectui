---
---

Test-only change in `@object-ui/fields`: the fifteen test files that use
`@testing-library/jest-dom` matchers now import jest-dom themselves instead of
relying on a sibling test file's bare import to register the matcher types
program-wide (objectui#8722). No published behaviour changes — `files` ships
`dist` only, and no artifact derived from a `.test.` file reaches it (measured,
with a control: 0 test-derived files in `dist`, 80 `.d.ts` present).
