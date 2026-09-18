---
---

Comment-only truthfulness fix in `@object-ui/plugin-view`, delivered with the pin that
keeps it honest (objectui#9806).

`ObjectView`'s `handleRowClick` carried a comment, written by the pull request that
repaired the objectui#9462 forwarding, closing with the claim that what
Cmd/Ctrl/middle-click should do when no host handler is present "is the hook's own
decision, taken before this callback runs". The hook never makes that decision on this
path: `useNavigationOverlay`'s `handleClick` returns early on the `onRowClick` it is
handed, ahead of its own modifier branch, and `ObjectView` hands `handleRowClick` down
unconditionally — so that branch is unreachable from this component. The comment now
states what the code does. The payload is forwarded and not acted on; with no host
`onRowClick`, a modifier click on an `ObjectView` row does exactly what a plain click
does and opens no browser tab of its own; and whether it should is a behaviour change on
a published component, left to its own card rather than smuggled into a comment repair.

The rewritten sentence arrives with an instrument rather than on its own, because a
sentence repaired without one is the same defect deferred (AGENTS.md #9). A new pin in
`@object-ui/plugin-view` drives a plain click and a modifier click at the same row
through the real hook and asserts the two are indistinguishable, alongside a control — a
bare `ObjectGrid` with no `onRowClick` in the way — whose two clicks DO diverge, so the
subject's equivalence cannot be a probe that never delivered `metaKey`. The same file
reads the claim out of the source with whole-line comments stripped, since the file
documents the very construct being asserted on, and controls that strip in both
directions; and it reads the comment's citation of the pin back out of the file, so the
prose and the code cannot drift apart in either direction without something going red.

Nothing published moves: no behaviour, no declaration, no exported value. This is a
comment and a test.
