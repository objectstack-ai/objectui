---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

fix(approvals): the console names a position approver `position:manager`, the spelling the server stores — not `role:manager` (objectui#11455)

The server stores an approval slot routed to a position as `position:manager`;
`role:manager` is the framework ADR-0090 D3 deprecated spelling, kept on the
server only for 15.x-era slots, and an approve that names it on a
`position:manager` slot is refused. Two console sites sent the deprecated one
for every position the session carries:

- **`sharedUserFeeds.approverIdentities`** — the bell badge, the bell's
  Approvals tab and Home's To-do card. Its docblock also called `role:` the
  server's addressing scheme, which it is not; it now says what the server
  stores.
- **`approvalsApi.buildApproverIdentities`** — the Approvals page's "My
  Pending" filter, its Approve / Reject enablement, and the `actor_id` a
  decision names.

What a host sees: a request waiting on a position the user holds is listed and
can be approved or rejected from the Approvals page, and the decision is
recorded under `position:manager`. No `role:` spelling is sent beside it as a
fallback, so a 15.x-era slot still stored as `role:manager` no longer enables
Approve / Reject through the position alone. The better-auth `user.role`
scalar is not a position and keeps its own `role:` identity.
