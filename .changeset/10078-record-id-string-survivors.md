---
'@object-ui/types': minor
'@object-ui/core': minor
'@object-ui/data-objectstack': minor
---

**BREAKING** — the last three record ids that still admitted a number are strings
(objectui#10078). `CommentSearchResult.recordId`, `RecordSubscription.recordId` and
`DataSourceMutationEvent.id` narrow **FROM** `string | number` **TO** `string`.

```ts
// before — compiled
const bell: RecordSubscription = { recordId: 42, subscribed: true };
// after — refused by the compiler; write the id the protocol carries
const bell: RecordSubscription = { recordId: '42', subscribed: true };
```

**Why.** objectui#9511 ruled that a record id is a string wherever this package names one,
as one rule with no exception, and narrowed `CommentEntry.recordId` and
`MentionNotification.recordId` on that ground. These three carry the same id and were left
with the old spelling: `CommentSearchResult.recordId` is copied straight from
`CommentEntry.recordId`, `RecordSubscription.recordId` names the record a notification bell
is for, and `DataSourceMutationEvent.id` is the id the `update` / `delete` doors already take
as a string. A rule stated as universal with quiet exceptions in the same file teaches the
opposite of the rule, so they follow it now.

**What changes at runtime.** `ValueDataSource` and `ObjectStackAdapter` now emit
`onMutation` events whose `id` is always a string. Both methods still accept a numeric id
through their own wider parameter, and each converts it at its own boundary before emitting —
the one place the rule says the conversion lives. An in-memory `value` source whose items
carry numeric keys therefore announces `'42'`, not `42`. A subscriber that compared
`event.id` against a number must compare against the string. The two in-repo subscribers
that read `event.id` already pass it through `String(...)`, so they see no difference.

**What a host has to do.** Code that builds a `RecordSubscription`, reads
`CommentSearchResult.recordId`, or implements `DataSource.onMutation` with numeric keys
converts once, where the number enters (its own adapter or data boundary), and passes the
string from there on. ⛔ Nothing converts silently on the reading side.

**Disposition: ADR-0087 D7 — a published runtime TypeScript interface with no metadata
surface is carried by the compiler and needs no ledger entry; ⛔ no conversion entry, ⛔ not
a tombstone, ⛔ not an npm `major`.** None of the three has a zod mirror, none is authored into JSON, and no schema
references them, so there is no parse-time door and nothing for a conversion table to
rewrite: the compiler error at the numeric site is the delivery channel. Pre-GA a breaking
change ships `minor` with this banner (ADR-0087, amended 2026-09-13); `major` is refused
outright because every publishable package sits in one `fixed` group pinned to the
`@objectstack` major (`scripts/check-changeset-no-major.mjs`).

**Pin.** `record-id-string-survivors-10078.test.ts` in `@object-ui/types` asserts all three
members read `string` (not `any`), refuses a numeric literal at each, and keeps a
source-text census of the three declarations with controls that prove the census can fire.
