---
---

Internal only, no release: `@object-ui/core`'s `filter-tokens.ts` stops carrying
module-local copies of two `@objectstack/spec/data` exports —
`CONTEXT_TOKEN_SUGGESTIONS` (the near-miss suggestion map) and `isContextToken`
(the membership predicate) — and imports both instead (objectui#7265, the
`@object-ui/core` slice of the DEBT ledger in
`scripts/check-spec-symbol-derivation.mjs`).

Neither symbol was ever exported from `@object-ui/core`, so no published surface
moves. Behaviour is unchanged and was measured rather than assumed: the map
matched the spec's on nine keys, in the same order, with the same values against
the RESOLVED 17.4.0 pin (the seeding card had measured 17.2.0), and the resolver
returned byte-identical results and byte-identical warning text across 248 cases
(62 tokens x 2 placeholder spellings x 2 scopes) before and after the swap.
