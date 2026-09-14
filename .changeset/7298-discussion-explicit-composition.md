---
'@object-ui/app-shell': minor
---

A record page shows a discussion panel if and only if it composes one
(objectui#7298).

**⚠️ Behaviour change on a shipped default — migration below.** `RecordDetailView`
used to append a discussion panel below any record page whose tree placed no
`record:discussion` / `record:chatter` node, and the only documented way to
decline it was `assignedPage.disableDiscussion = true`. That escape hatch could
never be written: `PageSchema` is a `strictObject`, so the key is a hard parse
error rather than a dropped one, and the renderer reached it through an
`as any`. Meanwhile the appended panel was hard-coded open for writes (comment
input, reactions, threading), so a deliberately read-only page — over a
`protection: { lock: 'full' }` platform object, where the object-side switch is
unreachable too — had no authorable way to say no.

Maintainer ruling of 2026-09-12 (decision batch #120 item 5): *"a page is what
its author composes … nothing is appended by default and then removed by a
negative flag."* So the append is removed together with the unauthorable read —
nothing reads an undeclared page key any more — rather than the negative flag
being added to the protocol.

**MIGRATION — pages that relied on the automatic panel add one
`record:discussion` node.** Put it where you want the conversation to sit:

```ts
regions: [
  {
    name: 'main',
    components: [
      { type: 'page:header', properties: { title: '{name}' } },
      { type: 'record:details' },
      { type: 'record:discussion' },
    ],
  },
]
```

There is **no transition window and no opt-in flag** — this behaviour is gone in
this release. The node's own config is honoured as authored, so
`{ type: 'record:discussion', properties: { feed: { showCommentInput: false } } }`
is now the ordinary way to show a conversation without a composer.

**Who is affected.** Only **authored full pages** that omit the node. Synthesized
default pages and slotted pages are unchanged — `buildDefaultPageSchema`
composes `record:discussion` itself, which is why the out-of-the-box record page
still has its panel.

**Precedence, now enforced rather than documented.** `enable.feeds: false` on the
object stays the object's switch and outranks the page: an object with feeds off
shows no discussion panel, declared or not. Previously that gate sat on the
auto-append alone, so a declared (or synthesized) node rendered a panel on a
feeds-off object over a feed the view deliberately never fetched; the composed
tree is now pruned before it renders. Record pages for objects that never opted
out are untouched — the tree is handed through by reference.

Docs: `content/docs/guide/slotted-pages.md`.
