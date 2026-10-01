---
---

Docs and one test only, publishes nothing (objectui#5867, batch 7): the TypeScript blocks under
`content/docs/components/{basic,data-display,feedback,form}/**` that triage's classifier reads as
code were fenced `plaintext`, so `check-doc-snippet-types` never compiled them; they are now
fenced `ts`. Three of them then failed on names they used without declaring: `list.mdx` and
`empty.mdx` now import `SchemaNode` from `@object-ui/types`, and `calendar.mdx` declares its
`Day` alias locally, because the shipped `CalendarDay` is not exported. The now-zero rows of
those pages are deleted from `KNOWN_UNHIGHLIGHTED_TS_FENCES`. `button-group-doc-surface-6347.test.ts`
read the button-group page's interface out of its `plaintext` fence and now reads the `ts` fence;
its assertions are unchanged. No published behaviour changes.
