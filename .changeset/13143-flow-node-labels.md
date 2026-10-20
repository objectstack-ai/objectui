---
'@object-ui/app-shell': patch
---

The flow designer names a node by the name its author gave it, not by its id, in three places that used to print the id (objectui#13143):

- **Problems messages of a decision.** "Decision "node_1" has no default branch" now reads `Decision "Check budget" (node_1) has no default branch`. The id stays beside the name, so two decisions that share a label can still be told apart. The same holds for "has N default branches" and "has no outgoing branches", in en and zh.
- **A connection's title.** The connection inspector's header and Studio's Configuration header read `Check budget → Notify team` instead of `node_1 → node_2`.
- **A run's steps.** An expanded run in the Runs panel shows each step's node name beside its type, with the id on hover. A step whose node the flow no longer has still shows its id.

One rule names a node everywhere: its label, else the palette label of its type, else its id. Nothing is added to the package entry: no export, prop or language-pack key.
