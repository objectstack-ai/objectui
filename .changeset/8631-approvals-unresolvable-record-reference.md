---
"@object-ui/console": patch
"@object-ui/i18n": patch
---

Approvals inbox: a reference that cannot be resolved now renders a neutral
"cannot be opened" affordance instead of degrading to the opaque record id
(objectui#8631).

objectui#7108 tombstoned the class the platform FLAGS — `status: 'cancelled'`
plus `cancel_reason: 'record_deleted'`. A terminal (`approved` / `rejected`)
approval carries no such flag and never will: the upstream cancel path names
`status: 'pending'` in its `where`, deliberately, so history is preserved. Those
rows kept falling through to `formatIdentity(record_id)` and showing a truncated,
meaningless identifier where a business identifier belongs.

The desktop row, the mobile card and the request drawer now all render the
affordance for a reference that the viewer's own readability probe could not
resolve AND that carries no snapshot title — the two conditions under which the
opaque id was the only thing left on screen. A row whose snapshot kept a business
identifier is unchanged: it still shows that identifier with its link suppressed,
which is what objectui#5211 ruled. A row the server marked `record_deleted` still
gets objectui#7108's tombstone, which says something stronger because the server
asserted it.

**The copy names no cause, and that is the point.** The platform's read path
fuses "this id names nothing" with "your grants filter it out" on purpose
(existence non-disclosure), so nothing on the wire separates them and the console
may not invent the separation: telling a viewer a record was deleted would
confirm to them that it existed. The affordance therefore states only what is
true either way — there is nothing here to open — and is pinned by a test
asserting the rendered text carries neither a deletion word nor a permissions
word.

This sentence is console-authored, through this repo's own catalogue in all ten
locales, because it has no upstream original: `APPROVAL_CANCEL_REASON_LABELS`
declares exactly one option (`record_deleted`) and there is no cause code for
"unresolvable" — nor may one be requested, per the card's fence. That is why it
does not contradict the neighbouring rule against authoring a second copy of the
platform's tombstone sentence.

Also removed: the full, untruncated `record_id` that the desktop row hung in a
`title` tooltip on **every** row, readable ones included. The reference slot now
tooltips the identifier it displays.
