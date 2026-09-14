---
'@object-ui/core': patch
---

Fix the filter-token near-miss suggestion lookup reading `Object.prototype` (objectui#9129).

`resolveContextTokens` looked a near-miss spelling up in the spec's suggestion map with a
plain bracket index. Two lower-cased spellings, `{constructor}` and `{__proto__}`, are
inherited `Object.prototype` member names, so the lookup resolved to
`Object.prototype.constructor` / `Object.prototype.__proto__` instead of `undefined`, and
the console warning asserted a "suggestion" that was actually native-code / object text —
not a real token, not spellable, and not anything an author could act on.

This is **not** prototype pollution: the index was always a read, never an assignment, and
the resolved filter value is passed through untouched either way — no filter is ever
widened or narrowed and no record is ever mis-matched by it. The only observable effect was
a confusing string inside a `console.warn` call.

The fix builds the lookup over a null-prototype copy of the suggestion map instead of
special-casing the two names, so the whole class of collisions is closed (any inherited
member, present or future), not just today's two spellings.
