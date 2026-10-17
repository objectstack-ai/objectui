---
'@object-ui/console': patch
'@object-ui/i18n': patch
---

The OAuth consent page names the three agent scopes in words. An MCP client that asks for `data:read`, `data:write` or `actions:execute` used to show those as raw strings in the "This app will be able to:" list. Each now reads as one sentence: reading records, creating, changing and deleting records, and running actions on the user's behalf, each within the user's own permissions. The three sentences are new keys under `oauth.consent.scope` (`dataRead`, `dataWrite`, `actionsExecute`) in all ten language packs. Any other scope still shows as its raw string.
