---
---

The zod README's first worked example validates again, and the whole page is
pinned to the schemas it names (objectui#9522).

`packages/types/src/zod/README.md`'s `### Basic Validation` block — the first
thing a reader of this package runs — could not survive `ButtonSchema.safeParse`.
It authored `variant: 'primary'`, which is not one of the enum members
`ButtonSchema` declares, and `onClick`, which `form.zod.ts` declares through
`handlerKeyRefusal(..., 'runtime-slot', ...)` and therefore refuses for every
value (objectui#6124). `safeParse` returned two issues and the `if (result.success)`
branch the page exists to teach never ran.

The **example** is what changed, ⛔ not the schema: `'primary'` is not a Button
variant in this design system and `onClick` is a deliberate, pinned refusal, so
widening either to make a document pass would have published a wider acceptance
set to fix a paragraph.

`check:doc-snippets` compiled this fence and went on compiling it — its own header
names schema-key validity as a different question it deliberately does not answer,
because a general gate would have to guess which fences are complete documents.
`packages/types/src/__tests__/zod-readme-examples-9522.test.ts` declares that
boundary for this one page instead of guessing it: a ledger marks each worked
example and the verdict it teaches, every config is re-extracted from the page's
own fences rather than retyped, and an example added later with no ledger row
fails the file instead of shipping unpinned. The deliberately-invalid
`### Error Messages` example is ledgered as refused, and the historical body of
example 1 is kept as a control, so a widened `variant` enum or an admitted
`onClick` turns the suite red.

Test and documentation only; no package is released by this change, and
`src/zod/README.md` is not in any published tarball.
