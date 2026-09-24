---
'@object-ui/plugin-detail': patch
'@object-ui/plugin-grid': patch
---

fix(plugin-detail,plugin-grid): the record-grained write verdict is forgotten when
its record changes, and the row kebab's memo is per principal (objectui#10184).

Two hooks ask the explain engine (`POST /api/v1/security/explain`) whether the acting
user may update or delete a record, and memoise the answer at module scope so
revisiting a record is free: `useRecordEditable` in `@object-ui/plugin-detail` (the
detail header, the drawer and the console record page) and `useRecordCrudVerdicts` in
`@object-ui/plugin-grid` (the list row's kebab).

**Same principal, changed record.** objectui#10107 made the detail header's memo per
principal, but a verdict cached for one principal was still served after the record
changed under that same principal — ownership moved, a share granted or revoked — so
the record's new owner re-opening it in the same tab was still told no, and a
principal who had just lost access was still offered Edit. Both memos now listen to
the data-invalidation bus the writers already announce on (`notifyDataChanged`, and
every `DataSource` write through `useMutationInvalidationBridge`) and drop exactly
what a change stales, by the bus's own matching rule: a record-scoped change drops
that record's entries for both operations, an object-scoped change drops the
object's, `'*'` drops everything. A mounted hook asks again in place — the list only
for the rows that lost their answer — and an answer that was in flight when its
record changed is not cached.

**The row kebab, cross-principal.** `useRecordCrudVerdicts` carried the identical
un-principalled memo objectui#10107 repaired in the detail header: keyed
`object:recordId:operation`, it answered the next principal to sign in in the same
tab from the previous one's verdicts, in both directions — a `false` hid the kebab's
Edit from a user the server lets write the row, and a `true` offered it to one the
server refuses. It now keys by the acting principal exactly as the detail header does
and drops the map when the principal changes, so the two surfaces keep answering a
record identically.

What this does not make fresh, and says so at the site rather than implying it: a
grant or revocation made in another tab, by another user or by the server itself is
never announced in this tab, and a grant stored as a row of another object (a
record-share row, a permission-set assignment) is announced against that object, not
the record it grants — both land on the next page load. No lifetime constant was
added to paper over that.

Unchanged: the fail-open contract on an unknown answer (ADR-0124 D1 — the server
enforces, the client is courtesy), the request shapes, the probes' authenticated
channel, and the memo itself while nothing changes.
