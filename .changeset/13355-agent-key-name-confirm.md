---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Connect an Agent no longer mints an unnamed API key in one click (objectui#13355). "Create key" stays disabled until the administrator types a name, and the name is sent as typed: the key is no longer created as `agent-key` when the name box is empty. Clicking "Create key" now opens an in-app confirm naming the key; Cancel creates nothing, and confirming creates the key and shows it once to copy, as before. This matches Setup → API Keys → Create Key, which also requires a name.

New string: `connectAgent.apiKey.confirmTitle`, in all ten locale packs.
