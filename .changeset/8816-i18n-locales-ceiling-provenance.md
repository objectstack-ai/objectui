---
---

Record the maintainer ruling behind the `i18n-locales` per-chunk ceiling in
`scripts/check-eager-closure-budget.mjs` (objectui#8816). Prose only; no package
is released by this change and no constant moves.

The raise that landed as `fffa30d3f` rested its header provenance on the
maintainer's _instruction_ of 2026-09-10 that red pull requests are resolved
rather than parked — a priority instruction, and all that existed when the
sentence was written. The route ruling exists now: director seat summon #21,
decision batch #110 item 3, recorded on objectui#8816 at comment 5615808548 on
2026-09-10, on the maintainer's reply to the recommendation of route A at
comment 5615318265. The header now rests on that, quotes the ruling's own
refusal to be read as a precedent — the next change that meets this line returns
to the decision box — and records the sequence plainly: the pair landed as a
rider inside PR objectui#8901 about two hours and forty minutes ahead of the
ruling, and not in the dedicated pull request the ruling asks for.

The number is right and it is ruled, so nothing moves it back: a revert to
re-land it in the ruled shape would land `main` red on this line for form. What
was wrong is the record, and a record is repaired by writing it.

Two further sentences in the same header are repaired in the same commit, for
the same reason and by the same event. The `PER_CHUNK_BASELINE` entry for
`i18n-locales` described itself as a FORWARD reading naming "a state `main` has
not reached yet ... while only one claimant has landed". `main` reached it:
`fffa30d3f` at 2026-09-10T06:05:37Z and `8ea3beee4` at 2026-09-10T06:05:40Z are
three seconds apart and both ancestors of the tip, so the sentence was false as
written. Both sites — the prose entry and the inline comment above the constant
— now say what the reading now is, and neither restates a headroom the gate is
the only thing that can keep current.
