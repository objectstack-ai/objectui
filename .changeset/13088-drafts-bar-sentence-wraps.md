---
'@object-ui/app-shell': patch
---

On a phone, the AI chat's pending-drafts bar shows its whole sentence (objectui#13088).

The bar above the composer that says how many changes are not published yet drew its sentence on one line and cut it with an ellipsis, so at 390 px wide the half saying users cannot see the change was lost, in Chinese and in English. The sentence now wraps onto a second line (a third in English at 320 px), and the Publish button keeps its place on the bar. The bar grows a few pixels taller in flow above the input, so the conversation gives up the room and the input is not covered. On the full-page chat at desktop widths nothing changes: the sentence fits on one line there. In the console's side dock, where the English sentence was cut as well, it now wraps to two lines.
