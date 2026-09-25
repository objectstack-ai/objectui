---
---

Test-only change, no package released: the shared declared-input sample in the console's
`record-block-record-reach.test.tsx` authored its `sections` entry heading as `title`, a key
`@objectstack/spec` refuses inside a `record:details` section entry (objectstack#11902 pins the
refusal) and the renderer no longer reads since objectui#6190. The sample now spells it `label`, and
the `record:details` probe reads the heading back, so a sample spelled any other way falls back to
the section `name` and goes red instead of staying green (objectui#7321).
