---
'@object-ui/app-shell': patch
---

fix(app-shell): drop the flow `end` node's "Output variable" field — a key `EndConfigSchema` refuses by name

The `end` group of the flow node inspector offered an **Output variable** text box that wrote
`config.outputVariable`. `EndConfigSchema` is a strict object whose entire key surface is `outcome`
and `message`, so the loader refuses that key **by name** (`Unrecognized key(s) on this end node
config`) — anything an author typed in the box made the flow unloadable (`unrecognized_keys` at
parse, a 422 on save), with nothing in the form to say which of the group's two rows had done it.

The field is removed rather than tolerated: the renderer does not grow a lenient path around the
contract, and an `end` node terminates rather than producing a value to bind. `outputVariable`
stays exactly as it was on every other group whose spec config declares it. A stored value is not
hidden by the removal — an unowned config key falls through to the Advanced (JSON) block, which
auto-opens when non-empty, so it stays visible and clearable.

Removing it also un-hides the cross-field rule shipped for the `end` node's `message`: an
unrecognized key short-circuits `EndConfigSchema`'s `superRefine`, so while the box existed a
`refused` end that used it reported only `unrecognized_keys` and never the missing-`message`
refusal.
