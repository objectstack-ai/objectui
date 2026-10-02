---
---

Docs-only: the "Readers only." paragraph of `skills/objectui/rules/protocol.md` said that a `bind` on `data-table` renders its header over an empty body "— no error, no warning" (objectui#11009). The render tier is not silent: `data-table` logs one `[ObjectUI] DataTable bind:` console warning per such node (objectui#6575). The parser tier is: since objectui#11008 `validateTree` counts `bind` among the base props every node may carry, so it draws no `unknown-prop` there. The clause now says both. Every other sentence of the paragraph, and every example, is unchanged; no published package source moves.
