---
---

Test-only change: the `objectui#8466` calendar flat-key pin file now anchors its
off-disk assertions to behaviour instead of to formatting — the renderer reads a
key (either spelling, so dropping the `as any` cast stays green), a key is in the
config memo's dependency list (sliced structurally, not regexed), and the README
teaches all five in one markdown block (wrap-insensitive). The vacuous runtime
`it` is renamed to say it keeps the compile-time `siblingPins` tuple referenced,
and now checks that tuple's arity against the flat-key list. No published
behaviour changes.
