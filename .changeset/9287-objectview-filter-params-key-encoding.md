---
'@object-ui/app-shell': patch
---

`ObjectView`'s `filter[...]` memo key is built with `URLSearchParams` instead of by
hand, so a filter value containing `&` or `+` reaches the reader intact
(objectui#9287).

The key was `entries().map(([k, v]) => k + '=' + v).join('&')`, then re-parsed with
`new URLSearchParams(key)`. `entries()` yields DECODED values, and the join put the
two characters that are structural in a query string back unescaped: `&` truncated
the value at its first occurrence (`Smith & Sons` reached the reader as `Smith `,
leaving a stray empty-valued param) and `+` arrived as a space (`A+B` as `A B`).
Neither produced an absent condition — the destination list rendered, scoped by a
silently wrong value, with nothing to say the value had been cut.

Reachable from ordinary in-app navigation: any related-list "View All" (or nav
`filters` link) whose parent key value contains an ampersand or a plus. A company
name holding `&` is ordinary data, not hostile input.

The selection now appends onto a `URLSearchParams` (`selectFilterParams`) which the
memo reads directly; `toString()` percent-encodes and only keys the memo, so the
serialize-then-re-parse round trip that lost the character is gone rather than
patched. The key still absorbs unrelated `uf_*` params, which is the only reason it
exists. Plain equality is unchanged — `filter[account_name]=Acme` reads identically
before and after.
