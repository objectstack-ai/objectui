---
---

Tests only, no runtime change: 29 source-scanning test files stop hand-rolling a private
comment stripper and go through the shared `scripts/js-comment-mask.mjs` instead
(objectui#9183).

That module's own header names the family they belonged to — the **naive regex**,
`src.replace(/\/\*[\s\S]*?\*\//g, '')` plus a `//`-to-end-of-line rule — as one of the
two failure modes it exists to retire. A regex cannot see a string literal, so a `/*`
inside a string opens a phantom comment that runs to the next real terminator and
deletes every line of real code in between; the scan then reports clean over source it
never looked at, which AGENTS.md calls worse than having no verifier at all. The
conversion follows the two precedents already in the tree
(`ObjectView.relayRungCensus-7559`, `ObjectKanban.titleFieldPrecedence-8308`): a
`@ts-expect-error` import of the plain-JS helper plus a local typed alias, so the call
sites stay checked.

**The verdict diff came first, and it is the reason this stayed a cleanup.** Each
carrier's own stripper was extracted, executed, and compared against `maskComments` on
exactly the files that carrier reads. No carrier's ANSWER changes: every assertion the
29 files make is the same before and after (312 tests, unchanged). Five of them do
already erase real code on files they scan — a placeholder string holding
`'// (input, ctx) => result'`, a regex literal spelling `/\/api\/v1\/auth\//`, a CSS
comment inside a template literal — but none of the erased spans carries the signal its
test decides from, so they were fragile rather than wrong. The two `expect(offenders)
.toEqual([])` ratchets were re-derived both ways and produce byte-identical offender
lists and caller sets.

`maskComments` blanks rather than deletes, so every byte offset and line number survives
the mask. Two carriers carried explicit prose reasoning about the index shift their old
stripper caused (`filter-builder-mirror-6939` spells it out over four lines); that hazard
is now structurally impossible for a converted reader, not merely avoided.

Three carriers are deliberately NOT converted, because their stripper is not applied to
JavaScript: `empty-base-classes-override-friendly-8525` strips CSS, `ci-cd-pipeline-doc`
strips Markdown and YAML, and `skill-guide-data-table-binding` strips JSONC before
`JSON.parse`. `js-comment-mask.mjs` answers "is this span a comment, or code?" for
JavaScript, and pointing a JavaScript scanner at CSS or YAML would be a new guess rather
than the shared answer.
