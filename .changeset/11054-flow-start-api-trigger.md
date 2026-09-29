---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's flow start node writes the `api` trigger the engine routes, and can set its secret

The flow designer's start-node inspector offered a 「Webhook / API」 trigger that
wrote `triggerType: 'webhook'`. `resolveFlowTriggerKind` (`@objectstack/spec`)
answers no trigger kind for that token, so a flow authored this way bound no
trigger and never received a post. The option now writes `api`, the token the
engine routes to the inbound hook.

The start node also gains the inbound hook's per-flow `config.secret` field,
shown when the flow's trigger kind is `api` — by the start node's trigger, or by
a flow-level `type: 'api'`. The engine refuses an `api` flow whose start node
carries no secret. The field is write-only:

- a value already on the node is never put back into the control;
- leaving it blank writes no key, so a save that never touched it keeps the
  stored secret;
- while the flow is `api`-kind and no secret is entered, a notice says the flow
  is refused without one. A server that withholds the secret from definition
  reads serves the node without it, so the notice also says that a secret
  already saved is kept.
