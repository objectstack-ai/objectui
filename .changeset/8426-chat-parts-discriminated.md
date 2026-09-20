---
'@object-ui/plugin-chatbot': minor
---

Build the chat runtime's discriminated tool parts at the PRODUCER, and delete the last
`as any` on the `useChat` call (objectui#8426; director seat, decision batch #86,
2026-09-08, option A — contract-first).

`useObjectChat`'s API-mode builder declared its part array as
`Array<Record<string, unknown>>` and pushed plain objects into it. That is not the
store's part union, and the mismatch was absorbed by a cast on the `messages` option
rather than reported. Measured 2x2 on this branch, each leg mutated on disk with hash
proof: with both that cast and the blanket one objectui#8378 removed gone, both
type-check programs turn red with one `TS2322` each — `Record<string, unknown>` is not
assignable to the store's part type. The builder now CONSTRUCTS each part, so the
option is checked and the cast is gone.

**Breaking, deliberately — `UseObjectChatOptions.initialMessages`.** A message's
optional `parts` member is now declared as the store's own part array instead of
`Array<Record<string, unknown>>`. Nothing in this repository sets it (the schema
renderer passes `schema.messages`; app-shell passes the output of
`hydratedMessagesToChatMessages`, whose literal declares no `parts`), so this is
visible only to a host that hands `useObjectChat` pre-built parts — which is exactly
the population the cast was hiding the mismatch from. Per this repo's version policy a
breaking change ships as `minor`; migration is to build real parts (or drop `parts` and
let the builder synthesize them from `content` / `toolInvocations`).

Three behaviour changes ride with it, each measured rather than assumed:

- **The three approval states are now reachable.** `approval-requested`,
  `approval-responded` and `output-denied` require the runtime's `approval` envelope
  alongside them; `ChatToolInvocation` gained that envelope in objectui#9229, and the
  builder now constructs those arms from it. Before this, such an invocation was
  emitted as an untyped object the store could not hold.
- **The legacy authoring states are folded, not passed through.** `partial-call`,
  `call` and `result` are not runtime states; passing them through left the round-trip
  reader refusing them, so the invocation came back with no state at all. They now fold
  onto `input-streaming` / `input-available` / `output-available`.
- **The dead `toolName` member is no longer written onto a `tool-*` part.** Only the
  dynamic-tool arm declares one, and the round-trip reader derives the name off the
  part's `type`, so dropping it is behaviour-preserving.

An invocation that claims an approval state with no envelope to back it is not
constructible, and no envelope is invented for it: the state is derived from the data
the invocation does carry and the producer is told once, by name. An ObjectStack HITL
approval (`pendingActionId` plus a `pending_approval` result) is deliberately NOT
reported — it is carried by that id, and the mapper re-promotes the state from the
result on the way back out.

Also lifts the `approval` envelope in `mapMessages`' tool-invocation extraction, which
closes the disagreement objectui#9229 left behind: the hydrated path carried the
envelope while the live path dropped it. The lift lands in the same round as its first
reader, rather than earlier as a declared-but-unread key.
