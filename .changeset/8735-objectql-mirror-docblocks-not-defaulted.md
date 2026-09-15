---
'@object-ui/types': patch
---

Correct four `zod/objectql.zod.ts` docblocks that described the behaviour objectui#8317
removed. Since that change the zod mirrors strip imported `@objectstack/spec` defaults at
this package's import boundary, but the docblocks on `HttpRequestSchema`, `ListColumnSchema`,
`SelectionConfigSchema` and `PaginationConfigSchema` still said, in the present tense, that
`method`, `prefix.type`, `type` and `pageSize` are defaulted on parse — the opposite of what
each export does. Each now says the key is declared and accepted but NOT defaulted on parse.

Comment-only: no default, no behaviour and no accept set moves. The corrected text is
published — it is emitted verbatim into `dist/zod/objectql.zod.d.ts`, which is why it earns
an entry rather than being an internal note.
