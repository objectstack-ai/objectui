---
'@object-ui/app-shell': patch
---

A caller the Setup app refuses gets the access-denied screen on Setup's item pages instead of those pages under another app's chrome (objectui#12706).

A member without `setup.access` who opened `/apps/setup` landed on the default app's landing (the CRM dashboard, say), and `/apps/setup/metadata/...` drew the permission-set list and the permission-set and position editors under that app's chrome. The server refused every read that mattered, so nothing leaked, but the screen was wrong. Setup's root and the metadata-admin routes (with the legacy `component/metadata/...` spellings that forward onto them) now wait on the access verdict for the app the URL names, the same by-name probe an ordinary app's routes already wait on, and draw "You don't have access to this app" when the server refuses, with nothing of the page mounted. An admitted caller sees no change, and every verdict other than a refusal renders the page as before. Setup's `system/*` pages and the record pages under the Setup segment are not gated: a member reaches the approvals inbox there, and the records it links to.

The permission-set editor's Assigned Users section no longer draws a refused holders read as "0" and "No users assigned yet": it says the refusal in the server's words, and the empty copy follows only a read that succeeded. A refused Remove is said the same way instead of being swallowed. The position editor's holders section says a refused or failed holders read the same way, with no count, instead of drawing the refusal above "Nobody holds this position yet."
