---
'@object-ui/data-objectstack': patch
---

The connection state follows the requests the console already makes, so the header chip now shows a mid-session outage (objectui#12295).

Until now the adapter set its connection state only while making the first connection. Once that had succeeded, no failed request could change it, so a backend that stopped mid-session left stale rows on screen and the header chip hidden.

- **A request with no HTTP answer** (refused, reset, unreachable) moves the state to `reconnecting`. Once the adapter's own retry window is spent, it moves to `error`. The window is the same `autoReconnect` / `maxReconnectAttempts` budget a failed first connection gets, counted in unanswered requests. The state stays there until a request is answered, and the header chip stays visible the whole time.
- **The next answered request** moves it back to `connected`, and the chip hides again after its brief "Connected" flash.
- **An answered HTTP error does not move it.** A 4xx or 5xx means the server is reachable. A request its caller aborted does not move it either.

The adapter adds no timer, no heartbeat and no request of its own: the state changes when a request the host makes settles. Every request goes through the adapter's one fetch, including those made through `getClient()`, except `uploadFile` / `uploadFiles`: those two call the global `fetch`, so an upload's outcome does not move the state. The fetch hands its response or rejection to the caller unchanged. Nothing is added to the package entry: no export, option, type member or language-pack key.
