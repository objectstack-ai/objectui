---
---

Documentation and test-only change — this publishes nothing, declared explicitly with an empty
frontmatter rather than left undeclared. No package `src/` is touched: the diff is
`content/docs/guide/ci-cd-pipeline.md` plus new assertions in the test that already owns that page.

Three sentences on the CI/CD guide stated a live population as a literal with nothing deriving it:
the docs-page population the eager-closure section credits to the `/docs/[[...slug]]` route, the
file population the shell-escape section credits to the `skills` scan root, and the sweeper's page
window, copied out of a source constant. The first was measurably false — it claimed 181 against a
corpus of 184 git-tracked `.md`/`.mdx` files under the directory `apps/site/source.config.ts`
declares — and nothing in CI could go red over any of the three.

Each sentence now names the tree its population is derived from and the run that prints the live
reading (the eager-closure gate's `gauge:` line, the residue gate's per-root `N file(s), N fence(s)`
line, and `CLOSED_ISSUE_WINDOW_PAGES` in the sweeper), and `ci-cd-pipeline-doc.test.ts` refuses a
count written back into any of the three sections. The numbers were not corrected: a corrected count
with nothing checking it is the same drift a month later.

The assertions read the page as JOINED text, because both defective sentences wrapped — the numeral
ended one line and its noun began the next, so a per-line reader returns zero for sentences that are
plainly present. The pin proves its own unit by finding a phrase this page carries that no single
line contains.

Four neighbouring sentences that state the commit or window they were measured on are deliberately
untouched: those declare their measurement, which is the remedy rather than the defect. A fifth
figure on the same page states its population with a hyphen, which the family's noun pattern does
not match; it is recorded in the pin's own comment and filed as objectui#9004 rather than fixed
here, because the same figure is mirrored outside `content/docs/**`.
