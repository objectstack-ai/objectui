---
'@object-ui/console': patch
---

A Setup settings page reads its namespace again after a successful save or action, and takes the whole answer, manifest included (objectui#13382). The server computes parts of a namespace's manifest on every read: objectstack#25448 puts a live-status banner first on the page, so Setup → Email says whether mail leaves the machine. The page used to merge only the saved values and keep the manifest from its first load, so after an administrator configured SMTP the banner still said no mail leaves the machine until the page was reloaded.

The re-read does not show the loading placeholder. An action leaves the unsaved edits as they are. If the re-read fails, the page keeps the saved values and the success message, and does not turn into an error.
