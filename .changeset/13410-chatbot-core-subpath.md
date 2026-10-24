---
'@object-ui/plugin-chatbot': minor
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The Console's first page load no longer downloads the chat UI (objectui#13410). The `plugin-chatbot` chunk (169.6 KB gzipped, the third-largest eager chunk) and most of `vendor-markdown` used to load on every page, including for users who never open a chat, because the console shell imported a handful of small helpers from the `@object-ui/plugin-chatbot` package root, and the root re-exports the renderer that registers the chat components when it is evaluated. Measured on the Console's production build, the eager closure drops by 254,055 gzipped bytes (3,326,111 to 3,072,056). The chat now loads when it is first shown: opening the dock, visiting `/ai…` or `/s/:token`, or rendering a `chatbot`, `chatbot-enhanced` or `chatbot-floating` node.

`@object-ui/plugin-chatbot` adds a side-effect-free `@object-ui/plugin-chatbot/core` subpath: `useAgents`, `resolveDefaultAgentName`, `PLATFORM_DEFAULT_AGENT`, `agentHasCapability`, the agent alias helpers (`AGENT_ALIAS_GROUPS`, `agentAliasGroup`, `agentRouteName`, `resolveAgentParam`, `isBuiltinAgentName`, `isBuildAgent`, `isAskAgent`), `AI_USAGE_REFRESH_EVENT`, `emitAiUsageRefresh`, `publishHealthFromResponse` and `detectPendingApproval`, with their types. Importing it registers nothing and reaches no chat UI module. The package root still exports every one of these names, unchanged.

`@object-ui/app-shell` takes those names from `/core`, and the ChatDock loads its default chat body on first render instead of importing it. `resolveApiBase` is still exported from the same places.
