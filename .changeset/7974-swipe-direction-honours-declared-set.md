---
'@object-ui/mobile': minor
---

`useSpecGesture` fires a swipe on MEMBERSHIP of the declared direction set
(objectui#7974, maintainer ruling of decision batch #70).

`SwipeGestureConfig.direction` is declared `SpecSwipeDirection[]` — a set — and the
hook now honours the whole of it: it recognizes the any-direction move past the
threshold and fires only when the DETECTED direction is a member of the declared
set. It used to read `direction[0]` and fuse that one element into a
direction-specific recognizer, so every element after the first was declared and
then never honoured.

**Breaking in two narrow ways, deliberately.**

- A declared set with more than one direction now fires for all of its members.
  `direction: ['left', 'up']` used to fire on a left swipe only.
- An EMPTY or absent `swipe` sub-object now fires for nothing. It used to fall
  back to a left-swipe recognizer, so a config that declared no direction at all
  silently recognized one.

**The lenient cast is gone, and nothing replaces it (AGENTS.md #0.1).** The hook
also read a SCALAR `direction` through an `as string` cast, which the declared
array type rejects — a second, undeclared contract that let the shipped
`@example` (which passed `direction: 'left'`) appear to work when hand-tested.
That example now passes `direction: ['left']`, and no runtime path accepts a
scalar. A tree-wide scan of `packages/`, `apps/` and `examples/` for scalar call
sites — run with a firing control that planted one and found it — reported zero,
so no caller has to change for this.
