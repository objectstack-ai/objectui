---
'@object-ui/types': minor
---

feat(types)!: `maxToolRoundtrips` is retired behind a tombstone on all three chat nodes (objectui#5605)

**BREAKING (authoring).** `maxToolRoundtrips` on `ChatbotSchema`, `ChatbotEnhancedSchema`
and `ChatbotFloatingSchema` is refused by name. The zod twins now carry a
`retirementTombstone` arm whose message points at the agent's `planning.maxIterations`,
and the TypeScript member is `maxToolRoundtrips?: never`, picked onto
`ChatbotEnhancedSchema` and `ChatbotFloatingSchema` from `ChatbotSchema` so the three
faces share one declaration. The key also leaves the `body` / `children` refusal messages'
key lists and the published `ChatbotSharedKey` union (reachable through the
`@object-ui/types/complex` subpath): no registration reads it. Code that names
`'maxToolRoundtrips'` as a `ChatbotSharedKey` stops compiling.

**Migration:** remove `maxToolRoundtrips`; cap tool loops on the agent
(`planning.maxIterations`).

Why a refusal and not a working cap: a chat node cannot honour one. The tool loop runs on
the server agent inside one streamed response, the chat runtime (`useChat`) has no numeric
round-trip cap, and neither chat request schema in `@objectstack/spec` carries a cap field.
The value was threaded into the chat hook and dropped there, so setting it never limited
anything. Why not a plain deletion: `BaseSchema` is `.passthrough()`, so a deleted arm
would keep an authored value in silence.

The stage-one deprecation (`.changeset/max-tool-roundtrips-deprecate-5605.md`) never
shipped: that changeset is still pending, and no `CHANGELOG.md` in this repository
mentions the key's deprecation. So no release ever carried the "deprecated, still
accepted" state, and this entry moves the key straight from "accepted and ignored" to
"refused".
