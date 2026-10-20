---
'@object-ui/app-shell': patch
---

Flow designer: the cycle, repeated-connection and missing-boundary-host Problems, the canvas edge hover titles, the simulator's node list, edge rows and steps, and the nested inspector breadcrumb now name nodes by their label (the palette label when unlabelled) instead of their id. The cycle reads its nodes in order, with an id only after a label two of its nodes share; the repeated-connection and boundary Problems keep each node's id in parentheses beside its name.
