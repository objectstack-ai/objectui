---
'@object-ui/app-shell': patch
---

On a phone, the AI chat's "Preview app" pill no longer covers the composer's input (objectui#13068).

After a built app was previewed and the preview closed, the pill that reopens it floated over the chat (`absolute bottom-24`) and, at 390 px wide, sat on the input's first line. It is now a row of the composer's own area, in flow directly above the input, the same way the pending-drafts bar was placed (objectui#12978): with both showing, the pill sits above the bar, and the conversation gives up the room instead. Tapping the pill still opens the full-screen preview. Desktop widths are unchanged: the preview opens beside the chat there and draws no pill.
