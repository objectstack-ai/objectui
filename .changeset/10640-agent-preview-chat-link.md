---
'@object-ui/app-shell': patch
---

The agent preview's "Try in chat" link now opens the agent's chat page instead of redirecting to the home page (objectui#10640).

The link pointed at `/console/ai/agents/NAME/chat`. The console declares no route beginning with `/console`, so its catch-all redirected the author to `/`. As a plain anchor it also ignored the base path the console is mounted under.

`AgentPreview` now builds the link as `/ai/NAME?new=1`, the agent chat route the console declares, asking the chat page for a new conversation. The agent segment comes from `agentRouteName`, so a built-in agent uses its friendly name (such as `build`) and a custom agent uses its own name. The link is rendered through the router, so a console mounted under a base path (such as `/_console`) keeps it inside that mount, and it still opens in a new tab. When the preview is rendered with no router above it, as in the designer gallery, it draws no link.
