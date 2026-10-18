---
'@object-ui/core': patch
---

An `operation: 'update'` action no longer posts its declared `patch` as request `params` (objectui#12941). The platform action route applies the patch itself, from the action definition it resolves by name, so the request carries only the values collected for the action's declared `params`, plus the record id.

Before, `ActionRunner` merged the `patch` keys into the `params` it handed the registered `script` dispatch, so every declarative-update button sent field values its action never declared as params. The route wrote the same values either way, but a route that refuses undeclared params (ADR-0104 D2, objectstack#24268) answered every such button with a 400. The runtime half of that refusal waits on this change.

- **What a button writes is unchanged.** The route still writes the declared `patch` under the collected values, and a collected value of the same name still wins.
- **Undo is unchanged.** An `undoable` update still captures the prior value of every field the route writes, the `patch` fields included, because the runner reads them off the action, not off the request.
- **A custom `script` dispatch** registered on the runner is now handed an update action whose `params` hold the collected values alone. The action's `patch` is still on the definition it receives.

No key is added, removed or renamed, and no accepted input changes.
