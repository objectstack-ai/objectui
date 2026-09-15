---
'@object-ui/core': patch
---

Raise `@object-ui/core`'s declared `@objectstack/spec` floor from `^17.2.0` to
`^17.3.0` (objectui#9012) — the old range admitted a spec that refuses this
package's own output.

`normalizeListViewSchema` folds objectui's legacy toolbar flags onto the
`userActions` keys `group` / `hideFields` / `rowColor`, which the protocol
adopted in 17.3.0 (objectui#5435). `@objectstack/spec` was declared in
`dependencies` — consumer-facing — as `^17.2.0`, so any resolution landing on
17.0.0 / 17.1.0 / 17.2.0 satisfied the declared range and got a normalizer whose
output is refused **by name** at the view save gate.

Measured against the published artifacts rather than the workspace copy: each
published 17.x was installed into its own isolated consumer project and the
fold's real output parsed against that install's own `./ui` entry.

    17.0.0 / 17.1.0 / 17.2.0   REFUSED  refused-keys=[group, hideFields, rowColor]
    17.3.0 / 17.4.0            ACCEPTED

An undeclared firing-control key was refused by all five versions, so the
contrast is about those three keys and not about the harness. 17.3.0 is the
FIRST published version that accepts — verified across the entire published 17.x
stable line (17.0.0, 17.1.0, 17.2.0, 17.3.0, 17.4.0), not by taking the first
version that happened to work.

A second, independent key family lands on the same floor: `ListViewSchema` gained
`pageName` in 17.3.0, and the `page` view fixture this package already pins is
refused by 17.0.0 / 17.1.0 / 17.2.0 (`refused-keys=[pageName]` plus an
`invalid_value` on `type`) and accepted from 17.3.0.

No runtime behaviour changes: on the 17.4.0 every install resolves today, this is
the same normalizer. What changes is the declared contract — the range no longer
claims to work against specs that refuse its output.

`scripts/check-spec-range-floors.mjs` was green before and after, and would be
green at any floor here: its criterion is symbol PRESENCE, and
`UserActionsConfigSchema` is exported by every version above. The floor is held
instead by `normalize-list-view.declaredSpecFloor-9012.test.ts`, which carries
firing controls proving its comparator can redden.
