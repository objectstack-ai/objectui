---
'@object-ui/plugin-chatbot': minor
---

feat(plugin-chatbot)!: `useObjectChat` drops the never-honoured `maxToolRoundtrips` option (objectui#5605)

**BREAKING (authoring).** `UseObjectChatOptions.maxToolRoundtrips` is removed, so a host
that passes it to `useObjectChat` no longer type-checks. The three chat registrations
(`chatbot`, `chatbot-enhanced`, `chatbot-floating`) no longer forward the key, and the
one-time console notice that authoring it used to log is gone. The authored key is now
refused by name in `@object-ui/types` (see that package's entry). The notice's reset
helper was never exported from the package entry, so no other export moves.

**Migration:** remove `maxToolRoundtrips`; cap tool loops on the agent
(`planning.maxIterations`).

The option never capped anything. The hook gives `useChat` no client tool loop, so every
tool round-trip of a turn runs on the server agent inside one streamed response, and the
value reached neither `useChat` nor the request body.

The stage-one deprecation (`.changeset/max-tool-roundtrips-deprecate-5605.md`) never
shipped: that changeset is still pending, and no `CHANGELOG.md` in this repository
mentions the key's deprecation.
