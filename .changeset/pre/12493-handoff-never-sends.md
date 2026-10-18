---
'@object-ui/app-shell': patch
---

The AI build page no longer reads `?handoffPrompt=` from the URL, so a link can no longer send a message to the build agent on the signed-in user's behalf; the in-app "Open in Builder" handoff now travels as navigation state and is consumed once, so a reload does not send it again (objectui#12493).
