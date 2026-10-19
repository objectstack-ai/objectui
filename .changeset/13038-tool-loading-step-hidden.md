---
'@object-ui/plugin-chatbot': patch
---

The chat's step line no longer shows the agent's tool-loading step, and no longer counts it (objectui#13038).

On the build agent, a data question calls `load_tools` first to attach the data tools. That call read as "Load tools" (zh 「加载更多工具」) among the turn's steps, and it was counted in the step total. It is the agent's own plumbing, not a step the user asked for. The phase line and its expanded rows now leave it out, and the count drops by one. A phase that so far called only `load_tools` draws no line, instead of "0 steps". Every other step reads as before.

Nothing declares a tool as plumbing today, so the renderer keeps a private list holding `load_tools` only. Nothing is added to the package entry: no export, prop, type member or language-pack key.
