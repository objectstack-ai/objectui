---
'@object-ui/types': minor
'@object-ui/core': minor
'@object-ui/data-objectstack': minor
---

**BREAKING** — three more record ids that the objectui#9511 ruling's enumeration left out are
strings now (objectui#10078). `CommentSearchResult.recordId`, `RecordSubscription.recordId`
and `DataSourceMutationEvent.id` narrow **FROM** `string | number` **TO** `string`. ⚠️ Other
record ids in `@object-ui/types` still admit a number and are not touched here, among them
`DetailViewSchema.recordNavigation` (`recordIds`, `onNavigate`), `FeedItem.sourceId`, and the
`onNavigate` slots on `ObjectGridSchema`, `ObjectViewSchema` and `ListViewRuntimeProps`.

```ts
// before — compiled
const bell: RecordSubscription = { recordId: 42, subscribed: true };
// after — refused by the compiler; write the id the protocol carries
const bell: RecordSubscription = { recordId: '42', subscribed: true };
```

**Why.** objectui#9511 (director batch #195 item 1, letter A) ruled that a record id is a
string wherever **metadata** names one, and extended that, as 「the same principle」, to
`CommentEntry.recordId` and `MentionNotification.recordId`. It did not name these three, which
are runtime and API shapes rather than metadata. Carrying the rule to them is the `domain:spec`
seat's inheritance decision, recorded in the claim on objectui#10078: they hold the same id and
were left with the old spelling. `CommentSearchResult.recordId` is copied straight from
`CommentEntry.recordId`, `RecordSubscription.recordId` names the record a notification bell is
for, and `DataSourceMutationEvent.id` is the id the `update` / `delete` doors already take as a
string.

**What changes at runtime.** `ValueDataSource` and `ObjectStackAdapter` now emit
`onMutation` events whose `id` is always a string. Both methods still accept a numeric id
through their own wider parameter, and each converts it at its own boundary before emitting —
the one place the rule says the conversion lives. An in-memory `value` source whose items
carry numeric keys therefore announces `'42'`, not `42`. A subscriber that compared
`event.id` against a number must compare against the string. The two in-repo subscribers
that read `event.id` already pass it through `String(...)`, so they see no difference.

**Packages that narrow without a source change.** `@object-ui/collaboration` (`useCommentSearch`
returns `CommentSearchResult[]`) and `@object-ui/plugin-detail` (`SubscriptionToggleProps`
carries a `RecordSubscription`) publish the narrower type through their own `.d.ts`.

**What a host has to do.** Code that builds a `RecordSubscription`, reads
`CommentSearchResult.recordId`, or implements `DataSource.onMutation` with numeric keys
converts once, where the number enters (its own adapter or data boundary), and passes the
string from there on. ⛔ Nothing converts silently on the reading side.

**Disposition: ADR-0087 D7 — a published runtime TypeScript interface with no metadata
surface is carried by the compiler and needs no ledger entry; ⛔ no conversion entry, ⛔ not
a tombstone, ⛔ not an npm `major`.** None of the three has a zod mirror, none is authored into JSON, and no schema
references them, so there is no parse-time door and nothing for a conversion table to
rewrite: the compiler error at the numeric site is the delivery channel. The level is `minor`
because objectui marks its own breaking changes `minor` with this banner (AGENTS.md, version
alignment); `major` is refused outright because every publishable package sits in one `fixed`
group pinned to the `@objectstack` major (`scripts/check-changeset-no-major.mjs`).

**Pin.** `record-id-string-survivors-10078.test.ts` in `@object-ui/types` asserts all three
members read `string` (not `any`), refuses a numeric literal at each, and keeps a
source-text census of the three declarations with controls that prove the census can fire.
