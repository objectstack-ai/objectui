---
'@object-ui/types': patch
---

Correct a stale premise in the published declaration docs of the content-channel tombstones (objectui#9933).

The `body?: never` / `children?: never` docblocks of the components that read neither content channel (objectui#9256), and the `body?: never` docblocks of the components that read `children` (objectui#8284: `box`, `span`, `container`, `flex`, `stack`, `grid`, `scroll-area`, `form`, `toggle`), justified each tombstone by saying that `body` (and `children`) "are inherited-and-optional from `BaseSchema`, whose own docblock admits 'some components use `children` instead of `body`'". Since objectui#6771 retired the `body` spelling, that opening clause is false in the present tense: `BaseSchema.body` is `never`, and `BaseSchema`'s own docblock no longer admits the two-spelling ambiguity. These docblocks ship in the emitted `.d.ts`, so a declarations reader was taught the premise the retirement removed.

Each paragraph now dates the inherited-and-optional state to before its own tombstone and states the present: `BaseSchema` refuses `body` itself and still declares `children`, which the neither-channel tombstone refuses. The rest of each docblock — what the renderer reads, how that was measured, and the `@deprecated` remedy — is unchanged.

Comment text only: no declaration, member, type or export moves, and every authored document type-checks and parses exactly as it did before.
