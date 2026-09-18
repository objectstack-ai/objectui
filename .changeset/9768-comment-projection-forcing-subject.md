---
---

Give the comment projection at the three `packages/types` readers a subject that
reddens (objectui#9768). Test only; no package is released by this change.

`overlay-node-slot-doc-types-7082`, `alert-dialog-read-dialect-7104` and
`overlay-trigger-union-7081` each strip comments out of a `.ts` or `.mdx` source
before counting interface members, and over the whole population they project
the member map came back identical with the projection and with no projection at
all — so nothing would have noticed the guard being deleted, weakened, or
reverted to a hand-rolled regex. Each reader now declares a subject whose body
carries a member-shaped row inside an ordinary block comment (no `*` gutter, so
the row sits on the two-space anchor `members()` matches) and pins the member
list it reads off it. Removing `stripComments` from any one of the three now
fails that reader.
