---
'@object-ui/data-objectstack': patch
---

A failed first `connect()` with `autoReconnect` now retries discovery and settles (objectui#12318). The retry used to call `connect()` from inside the attempt it was retrying. `connect()` hands every caller the attempt in flight, so the retry waited on itself: one discovery read, a state stuck at `reconnecting`, and a promise that never settled. A console opened while its backend was down never finished starting, even after the backend came back.

- **Each retry is a new discovery read**, after the existing backoff (`reconnectDelay` × 2^(n-1)), up to `maxReconnectAttempts` times.
- **`connect()` settles.** It resolves once discovery answers, and the state ends `connected`. Once the retries are spent it rejects with the last attempt's `ConnectionError`, and the state ends `error`.
- **Concurrent callers still share one attempt**, including a caller that arrives during the backoff.

Nothing is added to the package entry: no export, option or type member. The state sequence of a failed attempt is unchanged: `error`, then `reconnecting` while retries remain.
