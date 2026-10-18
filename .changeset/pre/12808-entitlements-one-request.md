---
'@object-ui/app-shell': patch
---

Opening the Cloud pricing or Welcome page now asks for the organisation's environment entitlements once. The plan cards, the onboarding next step and the workspace-timezone notice share one request per organisation instead of each sending their own, so the page no longer waits for three of them in a row. The answer is re-read when the organisation changes, when the environment list refreshes, and on every later visit.

The console's startup also reads `/api/v1/runtime/config` once: the answer the page fetched for its early branding is reused instead of being fetched again before the first render.
