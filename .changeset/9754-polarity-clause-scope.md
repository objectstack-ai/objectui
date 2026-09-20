---
---

Internal only: the changeset polarity census (`pnpm census:changeset-polarity`)
now reads a claim's polarity in the clause that carries the declaration verb
rather than over the whole sentence, and its pin carries both legs of that
reading. No published source moves — measured, not assumed: over every file on
disk under the release packages' `files[]` after a full build, two lit controls
(`ObjectKanbanSchema`, `retirementTombstone`) light and every symbol this change
introduces (`readPolarity`, `clauseTexts`, `CLAUSE_BREAK`) reads zero, alongside
an absent control that also reads zero.

Refs objectui#9754.
