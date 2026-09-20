---
'@object-ui/types': minor
---

Refuse `onNavigate` and `onAddComment` by name on the `detail-view` JSON authoring
face (objectui#9447).

**Breaking, deliberately — and it closes an asymmetry rather than opening one.**
objectui#7804 made the `detail` arm refuse these two keys by name as objectui#6124
runtime slots. The `detail-view` arm, which reaches the *same* `DetailView`
component, declared neither — and `BaseSchemaCore` ends `.passthrough()`, so an
authored value was not refused, it stopped being judged and was KEPT. The same two
keys therefore had two different fates decided only by which `type` literal an
author wrote: refused by name on one, parsed green on the other and then handed to
a call site expecting a function.

Both keys stay DECLARED and unwritable rather than being deleted, which is the same
reasoning `onBack` (objectui#7344 / the objectui#6182 ruling) and `related`
(objectui#7997, ADR-0049) were settled with on this arm: under `.passthrough()` a
deletion leaves the silent accept exactly as it was and throws the diagnostic away
with it. The refusal message names the node-type spelling to author instead, and
that half is pinned too.

**The TypeScript face is unchanged.** `DetailViewSchema.onNavigate` and
`.onAddComment` keep their callable declarations, because a React host supplying
the function through props is the supported channel — only the JSON validator
refuses. That is the `onBack` precedent exactly.

**The read path was measured, not assumed.** Unlike `'detail'`, which registers
`DetailView` raw, `'detail-view'` registers `DetailViewRenderer` — a data-source
gate. The gate does not strip handler keys: it hands `DetailView` either the node
unchanged or a shallow spread whose only overwrites are the binding keys, so an
authored value arrives at `schema.onNavigate` / `schema.onAddComment` by identity
and is called. Driven end to end through the real `SchemaRenderer` in
`detail-view-handler-slots-9447.test.tsx`, which also records why
`scripts/check-handler-key-read-sites.mjs` is green here and always was: its
transitive hop stops at the wrapper.

**Migration.** Nothing in the measured corpus has to change. A node-level census
over this repo at `bbe57fdd5` — docs, examples, every tracked `*.json` / `*.mdx`,
and both first-party producers of a `detail-view` node — found **zero** authored
`detail-view` nodes carrying either key as a member. If a host application authors
one, supply the function as a React prop to `DetailView` instead, or author the
behaviour as a node type (`{ "type": "toast", ... }`, an `action:button` node).

**Not affected:** the nested `recordNavigation.onNavigate`, a different key at a
different path with a different signature (`(recordId) => void`), which stays
authorable on both faces; and `onTabChange`, whose disposition is still open on
objectui#7804 and which this change deliberately does not touch.
