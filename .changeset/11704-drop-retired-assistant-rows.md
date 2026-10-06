---
'@object-ui/console': patch
---

The Developer API console no longer lists the three retired ambient-assistant routes as try-it rows (objectui#11704). `GET /api/v1/ai/assistant`, `GET /api/v1/ai/assistant/skills` and `POST /api/v1/ai/assistant/chat` were retired on the server (objectstack-ai/cloud#2621), where they now answer 404 like a path that was never mounted, so each row was a try-it button that could only fail. The AI group keeps `POST /api/v1/ai/agents/:agentName/chat`, the named-agent route, as the one chat door.

A console opened against a server that still carries the routes no longer offers them either. Nothing else on the page changes.

**Clause-②: no.** Nothing on any package entry changes. No export, prop, type member or i18n key is added or removed.
