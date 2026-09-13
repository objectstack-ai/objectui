---
'@object-ui/app-shell': patch
---

Stop the plain object route swallowing a `filter[...]` operator suffix into the
FIELD NAME (objectui#9196). `ObjectView` was a THIRD reader of this URL family,
with its own greedy field capture, so `?filter[amount][gte]=100` on
`/apps/:app/:object` did not fail to match — it matched with the suffix inside
the field, emitting a condition against a field literally named `amount][gte`
that no object declares. The user got a silently WRONG query, not an ignored
parameter and not a refusal.

The route now reads through `drillUrlFilters`, the one module that owns this
family, via a new equality-only arm (`parseUrlEqualityFilterTriples`). Both arms
share ONE key grammar whose field slot excludes brackets, so the swallowing is
structurally impossible rather than fixed at one call site. An operator suffix
this route cannot execute is DROPPED — the posture the `/data` surface already
declares in as many words ("an unknown operator suffix is ignored, never
silently downgraded to equality"). Ignored and downgraded are two different
outcomes and only one is correct: answering `amount = 100` when the URL asked
for `amount >= 100` would be a wrong answer wearing a right answer's shape.

⚠️ Range operators are deliberately NOT added to this route. That would widen
the accepted set of an addressable public surface — a behaviour addition, not a
repair — and it stays with the maintainer. The operator arm remains on the
ADR-0055 `/data` surface only, which this change's tests pin on the same inputs
in the same run.

`patch`, justified by measurement rather than by intuition:

- Nothing an author authored changes — no spec key, no metadata key, no schema
  property is touched.
- Nothing stops type-checking for a consumer: `drillUrlFilters` is an internal
  module, not re-exported from `@object-ui/app-shell`'s only entry (`.` →
  `dist/index.js`), so the new export adds no public signature.
- The `/data` reader was differenced against its previous implementation over a
  254-case key corpus: 244 readings identical, 10 changed, and all 10 are keys
  whose FIELD NAME contains a `[` (`filter[a[b][gte]`), which previously emitted
  a condition against a field named `a[b`. Every delta is a narrowing that
  removes a wrong answer; none widens what the surface accepts.
