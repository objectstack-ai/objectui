---
---

Docs and test-only change; no published behaviour changes. Every `json` fence under `content/docs` now survives `JSON.parse`, and a fence that annotates JSON with comments is tagged `jsonc`. The one source file touched is a test in `@object-ui/types`: `page-actions-refusal-7926.test.ts` pinned four unparseable `json` fences in `guide/layout.md` as its blind spot, and that count is zero now.
