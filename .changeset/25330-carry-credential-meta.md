---
"@object-ui/types": patch
---

types: a node derived from an `@objectstack/spec` schema keeps the spec's `credential` registry key (`'value' | 'map'`, objectstack#25036, which marks the webhook's `secret` and `headers` as credential fields). `credential` joins `CARRIED_REGISTRY_META_KEYS`, so the derivation no longer drops it. The pin move to objectstack 830a63a6 put the key on the published surface, and the registry census (objectui#9102) reported it as unclassified.
