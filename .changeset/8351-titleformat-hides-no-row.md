---
'@object-ui/plugin-detail': patch
---

`record:details`' dedupe no longer hides a field row when the page H1 is an
interpolated `titleFormat` that names no single field (objectui#8351, maintainer
ruling 2026-09-08, decision batch #82, option B).

**What changed for a user.** On an object declaring a `titleFormat`, a record
whose title renders as a composite — `"{contract_no} - {name}"` rendering
`HT-2026-001 - Acme Corporation` — now shows **every** field in the details grid.
Before, one row silently disappeared: the ladder asked "which single field is the
H1 showing?", got the ADR-0079 declared pointer as an answer, and hid that row —
while the H1 was showing a template that is not that field's value, and is not any
field's value. Nothing errored; a field was simply absent.

**What did not change.** The dedupe still removes a genuine duplicate. Three cases
are distinguished, and the rendered title decides which:

- the template renders a composite no field's value equals → nothing is hidden;
- the template renders nothing on this record (no placeholder resolved) → the
  header has already walked past that rung onto the declared pointer, and the
  existing ladder hides that row exactly as before;
- the template collapses onto one field's value — a blank placeholder dropped with
  its orphan separator, or a single-field format like `"{name}"` → that row *is*
  the duplicate and is still hidden.

"Fully interpolates" is measured with the instruments already in the chain, not a
new predicate: `formatTitleTemplate` (what `getRecordDisplayName` step 3 and
`DetailView.resolveDisplayTitle` step 2 both call) renders the title, and
`recordDisplayValueAt` — the same emptiness authority the rest of the ladder uses
— answers whether that string is some candidate's value.

**Deliberately out of scope**, both by the same ruling: `page:header`'s own
`schema.title`, which this package cannot see at all; and the order in which
`PageHeaderRenderer` ranks `titleFormat` against the ADR-0079 name pointer, which
would move what the H1 *shows* on existing records and retire a currently-green
pin — a maintainer question carrying its own card. This fix deliberately does not
depend on which of those two rungs wins the header: it compares the rendered title
against the candidates' values, which answers the dedupe under either order.
