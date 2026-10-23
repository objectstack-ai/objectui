---
'@object-ui/fields': patch
---

A password or secret input now tells the browser what it is for (objectui#13295).

The password widget's editable input carries an `autocomplete` token. A field or action parameter whose name reads as the user's existing password (a word `current`, `old` or `existing` in the name, as in `current_password` or `oldPassword`) gets `current-password`; every other password or secret gets `new-password`. Before, the input had no token, so a browser treated each one as a sign-in field: it offered the saved site password for an API key or a new password, and its password manager could not tell the old password from the new one in a change-password dialog. The masked input and its show/hide toggle are unchanged.
