---
---

Docs and three tests only, publishes nothing (objectui#5867, batch 8): the TypeScript blocks under
`content/docs/components/{complex,disclosure,layout,navigation,overlay}/**` that triage's classifier
reads as code were fenced `plaintext`, so `check-doc-snippet-types` never compiled them; they are now
fenced `ts`. Twenty-four of them then failed on `SchemaNode`, a name they used without declaring, and
each now imports it from `@object-ui/types`. The now-zero rows of those pages are deleted from
`KNOWN_UNHIGHLIGHTED_TS_FENCES`. Three `@object-ui/types` tests read an overlay page's interface out of
its `plaintext` fence: `alert-dialog-read-dialect-7104.test.ts` and `overlay-trigger-union-7081.test.ts`
now read the `ts` fence, and `overlay-node-slot-doc-types-7082.test.ts` names each page's fence language
(`ts` for its five overlay pages). No assertion changes, and no published behaviour changes.
