---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:details` no longer prints a row directly under an H1 that shows the same value when a `titleFormat` collapses onto a field outside the fixed candidate list (objectui#10360)

**What changed for a user.** On an object with no declared name pointer, the
record page H1 is the rendered `titleFormat`. When a placeholder is blank the
template collapses onto the one field that still has a value, so
`"{contract_no} - {name}"` with a blank `name` renders `HT-2026-003`. The
details grid used to keep the "Contract No" row, printing `HT-2026-003` again
directly under the H1. That row is now hidden, as a collapsed template's row
already was when the field was `name`, `title`, `subject` or another candidate.

**What did not change.** The comparison is the one ruled on objectui#8351
(option B): a row is hidden only when its value EQUALS the rendered title, never
because a `titleFormat` exists. A composite title such as
`HT-2026-013 - Acme Corporation` is no field's value and still hides no row. Two
placeholders holding the same value render a composite too, so both rows stay.
The candidate list (the ADR-0079 resolver rungs and six literal names) is still
scanned first, and a candidate that matches still wins, so no row that was
hidden before is hidden differently now. The declared-pointer branch
(objectui#9436) still runs first and never consults the template.

**How a field counts as rendered.** After the candidates, the dedupe compares
the H1 against each record field whose value equals it and that the template
actually rendered. "Actually rendered" is asked of `formatTitleTemplate` itself,
by blanking that one field and rendering again, not of a second placeholder
parser, so it agrees with the renderer on `{{…}}` placeholders, whitespace
inside the braces and dotted lookup paths. A lookup whose display name happens
to equal the H1, but whose dotted placeholder rendered nothing, keeps its row.
At most one row is hidden.
