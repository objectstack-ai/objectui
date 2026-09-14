---
---

Widen `check:doc-snippets`' package-README walk to every depth (objectui#7308).
Tooling only; no package is released by this change.

The gate collected `packages/<name>/README.md` and nothing deeper — and it stated
that one level in its own header's SCAN SURFACE paragraph, so this was a
specification drawn too small rather than drift from one. Four tracked pages were
therefore neither compiled nor named on `UNGATED_DOCS`: "neither covered NOR
declared ungated", objectui#5174's phrase for the state that is strictly worse
than a named debt, arriving one directory down instead of one level up. The
sibling gate `check-doc-links` had already closed the identical hole on the
identical four files (objectui#6026).

Sized before it was changed, which is the only order in which the numbers are
readings. Re-derived on `9ba7e9c3`: of the 43 tracked files under `packages/`
whose basename is `README.md`, 39 sit at a package root and 4 sit deeper. With
the surface widened and no ledger row yet written, those 4 documents bring 20
`ts`/`tsx` blocks, 13 of which fail — 3 in the syntax phase, 10 in the semantic
phase — for 37 diagnostics.

So the ledger GROWS, by three rows carrying those measured counts and what would
have to change on each page. It grows by three and not four because
`packages/plugin-gantt/docs/verification/README.md` holds no `ts`/`tsx` block at
all: it joins the covered tier at zero blocks, and a row naming it would fail the
gate's own re-derivation as a stale entry. Leaving any of the four outside the
surface to keep the ledger short was refused — that is the defect this card
reported, committed a second time.

One page was worth the widening on its own: `packages/core/src/adapters/README.md`
teaches a custom-adapter template that declares `implements DataSource<T>` while
omitting the interface's required `getObjectSchema`, so a reader who copies it
gets a class that does not satisfy the interface it claims.
