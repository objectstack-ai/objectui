---
---

Docs-only: two published skill guides, `skills/objectui/guides/data-integration.md` and `skills/objectui/guides/schema-expressions.md`, still taught that a `bind` authored on a `data-table` fails with "nothing thrown and nothing logged" and that every non-reader component ignores `bind` with "nothing in the console" (objectui#11414). The render tier is not silent: since objectui#6575 `data-table` logs one `[ObjectUI] DataTable bind:` console warning per such node. The four sentences now say so, in the wording `skills/objectui/rules/protocol.md` converges on: no error, nothing on the page says why, the console warning is the one signal. Every fenced example and every other sentence is unchanged; no published package source moves.
