---
'@object-ui/console': patch
---

Integrations → Connect an AI agent no longer mints an API key in one click (objectui#13383). "Generate key" stays disabled while the name box is blank or whitespace-only, and the name is sent trimmed: a cleared box no longer mints a key under the default name `Agent key`. Clicking "Generate key" now opens an in-app confirm naming the key; Cancel creates nothing, and confirming creates the key and shows it once, as before. The name box still opens prefilled with `Agent key`, which is minted only once the administrator confirms it. This matches the Connect an Agent card (objectui#13355).
