---
'@object-ui/app-shell': patch
---

Flow canvas: a connection that skips a node is drawn around it (objectui#13144).

A Decision branch that goes past the next node, for example Decision → End past a Notify, was drawn as the same straight curve from the Decision's bottom to the End's top. The line ran under the Notify card, the branch label sat under the card, and a click on that spot selected the Notify. The flow looked like it had one branch.

Now a connection whose curve would cross a node turns aside onto a lane next to that node, runs down beside it, and turns back into its target from above. The lane goes on the side with the shorter way round. On a tie it goes left, away from the right-hand side where revise loops are drawn. The branch label sits on the lane, just below the source, where no card covers it. A click on the label or on the line selects the connection. The nested regions inside loop, parallel and try/catch containers are drawn the same way.

A connection that skips a row by passing in the gap between two of its cards keeps its straight line. Its label used to sit in that row, under both cards. It now moves up the same line to just below the source, beside the other branch labels. Any other connection that crosses no node is drawn exactly as before.

Nothing is added to the package entry: no export, prop or type member.
