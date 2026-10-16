---
'@object-ui/plugin-chatbot': patch
---

The AI Approvals inbox shows the error, not an empty queue, when its read fails, and its poll stops on an answer that will not change (objectui#11736).

On a deployment with no AI service, the open edition answers `501` on `/api/v1/ai/pending-actions`. `AiPendingActionsInbox` rendered the error alert and, beneath it, "No actions waiting". That reads as a live approval queue that happens to be empty, on a deployment that has none. `usePendingActions` also re-armed its five-second interval whatever the read answered, so the page asked the dead endpoint every five seconds for as long as it stayed open.

- The inbox shows the empty state only when the read answered. When the read failed, the error alert stands alone.
- `usePendingActions` now arms each poll after the previous read settles, according to its answer:
  - A refused read stops the poll. That is `501`, or any `4xx` except `408` and `429`, such as `401`, `403` or `404`. A manual `refresh()` that succeeds, the re-fetch after `approve` or `reject`, or a change to the hook's options starts it again.
  - A transient failure backs the poll off. That is no answer at all, `408`, `429`, or a `5xx` other than `501`. The delay doubles with each consecutive failure, up to 120 seconds, or up to `pollInterval` if that is longer.
  - A read that succeeds polls again after `pollInterval`, as before, and resets the backoff.

The policy is in the hook, so every caller of `usePendingActions` gets it, not only the inbox. With a working endpoint nothing changes: an empty queue still shows "No actions waiting", and the poll keeps its interval.

**Clause-②: no.** No export, prop, option, return member or language-pack key is added or removed, and no accepted input widens.
