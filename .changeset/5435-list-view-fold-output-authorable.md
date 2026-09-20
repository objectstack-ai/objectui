---
'@object-ui/core': patch
---

Pin that `normalizeListViewSchema`'s output is AUTHORABLE, and retire the stale
"pending promotion" note on the legacy toolbar-flag fold (objectui#5435).

objectui#5435 was filed against `@objectstack/spec@17.0.0`, where the fold turned
the legacy `showGroup` / `showHideFields` / `showColor` flags into
`userActions.group` / `.hideFields` / `.rowColor` — three keys
`UserActionsConfigSchema` did not declare, so the fold's own output was refused BY
NAME by the schema a stored view is validated against.

The maintainer ruled Option A (2026-08-22) and the fix landed **upstream**, not here:
the spec adopted all three, and its declaring docblock names this card by number.
This repo resolves `@objectstack/spec@17.4.0`, so the gap is closed in objectui's
actual installed behaviour, not merely in the protocol's source. Measured, with a
firing control that reddens on a genuinely undeclared key — the original defect was
that nothing ever asserted the fold's output was authorable.

⛔ The three toggles are NOT retired. `ListView` honours them and the protocol now
declares them, so tombstoning them here would leave objectui narrower than the
protocol.

No behaviour changes. The published bytes that move are one corrected docblock in
`dist/utils/normalize-list-view.js`, which is why this is a `patch` and not a
no-release changeset: the comment told future readers (human and AI) that the
promotion was still pending upstream, which is now false. Graded `patch` rather than
`minor` because no API is added, removed or reshaped.
