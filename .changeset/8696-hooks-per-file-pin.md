---
---

Register the seven remaining ported `.claude/hooks/**` files in
`scripts/upstream-port-pin.json`, each at its own `ref` with its own
`upstreamSha256` and its divergences declared as exact text pairs
(objectui#8696). Ledger data only — no package source, no published contract
and no hook byte moves, so no package is released by this change.
