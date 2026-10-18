---
'@object-ui/console': patch
---

The console's startup sends one `get-session` and one `runtime/config` request instead of two of each: the session check and the early-branding request now hand their answers to the app instead of having them fetched again before the first render.
