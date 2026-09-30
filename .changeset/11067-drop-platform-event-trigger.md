---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's flow start node stops offering 「Platform event」, a trigger no engine routes

The flow designer's start-node inspector offered a 「Platform event」 trigger
that wrote `triggerType: 'event'`. `resolveFlowTriggerKind` (`@objectstack/spec`)
answers no trigger kind for that token and no engine trigger binds it, so a
flow authored this way never fired, and nothing said so. The option is gone
from the trigger select, and the Object and Entry condition fields no longer
appear for that token alone.

A start node that already stores `triggerType: 'event'` is not rewritten. The
select shows the value flagged as one it no longer offers, and saving the flow
keeps it as stored. Pick a trigger the list offers to make the flow fire.
