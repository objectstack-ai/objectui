---
'@object-ui/data-objectstack': patch
'@object-ui/app-shell': patch
---

Studio stops asking questions whose expected answer is an error, so the browser console no longer fills with red lines that hide real failures (objectui#11799).

- **`MetadataClient.getDraft()` reads the drafts ledger first.** It reads `GET /meta/_drafts` through the client's shared read, and sends `GET /meta/:type/:name?state=draft` only when the ledger lists the name. An item with no draft no longer logs a 404. The method still resolves `null` when there is no draft and the draft envelope when there is one. A draft saved a moment ago is found, because a write drops the ledger read that was pending when it landed. A ledger the caller cannot read (403, 501, a network fault) counts as unknown, and the item read is sent as before.
- **Studio reads an item's published baseline only when it uses it.** The Interfaces pillar's leaves and the Automations pillar's flows read `GET /meta/:type/:name/layers` only for an item with no pending draft, and the Interfaces pillar reads none for an app found only in the drafts ledger. An item that was never saved always has a draft, so it no longer logs a 404 for `/layers`. Opening a leaf or a flow now waits for the ledger before it reads the item, one round trip more than the parallel reads it replaces. The Data pillar still reads `/layers` for an object that was never published: that answer is how it tells it has no records table yet.
- **The AI usage indicator asks nothing while AI is off.** It reads `GET /ai/usage` only while the agent catalog at its base lists an agent, the signal the console gates every AI entry point on. On an open-edition server, Studio's copilot dock no longer logs a 501 for it each time it mounts.

No REST answer, export, prop or type member changes.
