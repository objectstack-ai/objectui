---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): the `percent` summary chip beside the record H1 stated one percentage in its text and drew another in its bar — a stored `0.123` read `0.123%` next to a bar filled to 12.3%. Both halves now scale the stored value by the same rule (the bar's existing one), so the chip states the percentage it draws. Values already in percentage points, such as `12.3` or `250`, render exactly as before.
