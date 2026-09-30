---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:alert` resolves its CTA through the shared `resolveDeclaredActionIds` instead of a third hand-written lookup by name (objectui#7382)

`record:alert`'s optional CTA (`action.actionName`) was looked up with its own
`find` over the object's `actions` metadata. `page:header` and
`record:quick_actions` already share `resolveDeclaredActionIds` from
`@object-ui/types` for the same job (objectui#7182), so there were three
copies of one lookup. The banner now calls that function with a one-element
list, and with an empty list when no CTA is authored.

What stays the same:

- A known `actionName` renders the same button, backed by the definition the
  object registers. When two actions share a name, the first one registered
  still wins.
- An unknown `actionName` still renders no button and logs nothing. Catching a
  misspelled name is left to authoring time, in objectstack's
  `action-name-undefined` lint (objectstack#20105).
- With no `actionName`, the banner still makes no metadata read.

What is guarded or changes:

- An object authored at `actionName` renders no button. The shared function
  treats an array of objects as inline action definitions, but the banner
  reads only the action-id result. So an object in that slot is never handed
  to the action engine and never runs. The old lookup never matched an object
  either. The guard keeps the swap from turning that slot into a way to author
  an executable action.
- If an object's `actions` metadata is not an array, the banner now renders
  without a button. The old lookup threw inside the banner's render instead.
