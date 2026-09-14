---
---

Route the last two fence-opening predicates in `scripts/` through the shared
`markdown-fence-scan.mjs` authority and delete both private spellings
(objectui#9331). `check-prompt-component-keys.mjs` toggled its in-fence mask on
a run of any length, so a four-backtick opener was closed by the next
three-backtick line — body text, in CommonMark — and the gate then read code as
prose and prose as code for the rest of the file.
`check-doc-example-shared-reader.mjs` matched `@example` blocks non-greedily and
so ended an example at the first three-backtick run after it, parsing a
truncated example that still parses clean. Both were latent on today's corpus
and the output of both gates is byte-identical; the repair is pinned by cases
that fail without it. CI tooling only; no package is released by this change.
