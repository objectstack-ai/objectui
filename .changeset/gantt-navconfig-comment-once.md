---
---

`ObjectGantt` internal cleanup, measured as a zero-pixel change:

- The comment block above the `navConfig` default repeated its own last two
  lines verbatim, leaving a mid-sentence fragment. The sentence is now stated
  once, in full.
- The drawer default no longer spells the spec-deprecated `width`
  (`@deprecated [#2578 -> size]`). It is now `{ mode: 'drawer' }`, so
  `resolveOverlayWidth` returns `undefined` and `RecordDetailDrawer`'s own
  `width` default supplies the identical `min(960px, 60vw)`. The resolved
  overlay width is unchanged on every viewport, and is now pinned by a test.

⚠️ **Dated note, 2026-09-29 — the card in the quoted deprecation tag is objectstack's — objectui#11016.** The second
bullet quotes the spec's deprecation tag for `width`, whose bare number resolves
in this repository to an unrelated objectui item. It is
objectstack-ai/objectstack#2578, the spec card behind the `size` bucket that
replaces `width`. The text above is kept as the reading of this change.

No published behaviour changes.
