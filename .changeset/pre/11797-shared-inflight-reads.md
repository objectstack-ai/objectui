---
'@object-ui/app-shell': patch
'@object-ui/data-objectstack': patch
---

Opening a Studio package no longer sends the same read several times at once (objectui#11797).

Several readers mount together on Studio entry and each one used to send its own request for the same answer. A caller that arrives while an identical request is still pending now waits for that request instead of sending another:

- **`@object-ui/app-shell`:** the package list (`GET /api/v1/packages`, read by the Studio package switcher, the read-only gate and the object-name namespace lookup) and the pending-drafts count (`GET /api/v1/meta/_drafts`, read by the Studio top bar and the chat bar).
- **`@object-ui/data-objectstack`:** `MetadataClient.listTypes`, `list`, `listDrafts`, `get` and `getDraft`. Requests are shared between clients built on the same `fetch`, so the per-component clients the console creates share them too. Each caller, the first one included, still gets an answer object that no other caller holds.

This is not a response cache. Once a request settles, the next call goes to the server again. A failed request is shared only by the callers already waiting, and the next call retries. A write the reader can see drops any read still pending, so a read made after the write never gets the answer of a request sent before it. For the metadata client that is any save, publish or reset through a client on the same `fetch`. For the app-shell reads it is a package duplicate, the `objectui:packages-changed` announcement and the publish refresh pulse.

No exported function, method signature, option or type changes.
