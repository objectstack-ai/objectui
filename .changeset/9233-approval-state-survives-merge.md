---
'@object-ui/app-shell': patch
---

A rehydrated pending approval now reaches the chat as `approval-requested`
(objectui#9233).

`toUIMessages`' `mergeToolResultsInto` step rewrote the tool part's `state` on
every merge — `isError ? 'output-error' : 'output-available'`, unconditionally.
The server persists conversations in ModelMessage format (a tool CALL on the
assistant row, its RESULT on a separate `tool` row), so this merge runs on the
main rehydration path. A pending approval was therefore terminalized before the
mapper saw it, the `approval-requested` gate in `ChatbotEnhanced` never opened,
and the operator got no Approve / Reject card after a reload — even though the
id had been indexed and `decide()` was already wired (objectui#8442).

**Level, by measurement, not intuition.** `patch`: no exported signature, type
or declaration key moved (`packages/app-shell` type-checks unchanged, including
`tsconfig.test.json`), nothing an author authored today stops rendering, and
`approval-requested` was already a declared member of the tool-state union that
the live floating-chat mapper has always produced. What changes is one value on
one hydration path, in the direction of an affordance appearing where it was
supposed to. Consumers reading `state` off `toUIMessages` output may now observe
`approval-requested` / `approval-responded` where they previously only ever saw
`output-available`; that is the fix, and the union did not grow.

The rewrite itself is load-bearing and is kept: collapsing a dangling
`input-streaming` / `input-available` into a terminal state is why it exists, an
error result still wins, and both halves are pinned.
