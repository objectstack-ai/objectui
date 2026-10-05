---
'@object-ui/app-shell': patch
---

Switching an approval node's SLA escalation off in the flow designer removes the node's `escalation` block (objectui#11660).

The inspector used to write `escalation: { enabled: false }` when an author turned the switch off. `ApprovalNodeConfigSchema` refuses that block, because `timeoutHours` is required whether or not `enabled` is `false`. So the flow saved and then failed at the approval node on every run, and once the platform checks node config at save time, the save itself is refused. The spec states what the switch means: "the feature-level switch is whether the escalation block exists at all". So off is now no block:

- **Switching off removes the block**, with every value stored in it. The node's other config keys are not touched. A `config` left empty is dropped, as it is for any other cleared field.
- **No block reads off.** A node without an `escalation` block used to draw the switch on, with its four fields revealed, because the declared default (`true`) was applied with nothing to apply it to. It now draws the switch off. A block that omits `enabled` still reads on, and a stored `enabled: false` still reads off.
- **No bare `{ enabled: false }` block is written.** Clearing the last value kept under an older switched-off block removes the block too. A block that still holds another value is kept as it is.

Both field sources behave the same: the offline field table and the `configSchema` the engine publishes for the approval node. A stored `{ enabled: false, timeoutHours: 24 }` from older metadata still reads off, shows its value as kept but not in effect, and is not rewritten when the node is opened.

**Clause-②: no.** Nothing on the package entry changes. The new helpers (`switchedBlockOf`, `readFieldValue`, `isBareSwitchedOffBlock`) live in the inspector's own module, which `@object-ui/app-shell` does not export.
