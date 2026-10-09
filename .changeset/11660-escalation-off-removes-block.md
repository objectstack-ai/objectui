---
'@object-ui/app-shell': patch
---

The flow designer's SLA escalation switch on an approval node no longer writes a refused `escalation: { enabled: false }` block, and switching it off keeps the values the author entered (objectui#11660).

`ApprovalNodeConfigSchema` requires `escalation.timeoutHours` whether or not `enabled` is `false`. So `{ enabled: false, timeoutHours: 24 }` is a valid way to switch escalation off, and the runtime skips escalation for it. Having no block at all is also valid. The bare `{ enabled: false }` is not. The inspector wrote that bare block when an author switched off a node with nothing entered, because the switch drew on over a node that had no block. The flow saved and then failed at the approval node on every run, or, once the platform judges the block at save time, the save is refused.

- **No block reads off.** A node without an `escalation` block used to draw the switch on, with its four fields showing. The inspector applied the declared default (`true`) although there was no block for it to apply to. It now draws the switch off, and rendering writes nothing. A block that omits `enabled` still reads on, and a stored `enabled: false` still reads off.
- **Switching off with nothing entered writes no block.** Switching on writes `{ enabled: true }` alone. Switching back off before anything is entered removes the block instead of writing `{ enabled: false }`. A `config` left empty is dropped, as it is for any other cleared field.
- **Switching off a block that holds values keeps them.** The block gets `enabled: false`, and every entered value stays exactly as stored. They show as kept but not in effect, with a Clear action (objectui#6499). A block that has values but no `timeoutHours` yet keeps them too: no hours are filled in, and the block stays refused at `escalation.timeoutHours` until hours are entered, as it was before the switch.
- **Clearing the last kept value removes the block**, instead of leaving `{ enabled: false }` behind. A block that still holds another value is kept.

The offline field table and the `configSchema` the engine publishes for the approval node behave the same. A stored block is never rewritten just because the node is opened.

**Clause-②: no.** Nothing on the package entry changes. The new helpers (`switchedBlockOf`, `readFieldValue`, `isBareSwitchedOffBlock`) live in the inspector's own module, which `@object-ui/app-shell` does not export.
