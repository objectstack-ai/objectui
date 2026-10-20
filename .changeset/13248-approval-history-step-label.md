---
'@object-ui/app-shell': patch
---

The record's approval history names each step by the label the flow author wrote (objectui#13248). A history row used to draw the step's node id, prettified: "Manager Review" for a step authored as "Sales Manager Review". It now draws the step label of the approval request the row belongs to, the same label the panel's header draws for the pending step. It falls back to the prettified node id only when the request carries no step label, which is the header's existing rule.

The label comes from the request rows the panel already reads. The action history's own rows do not carry it, so no new request is made and no server change is needed. Nothing is added to the package entry: no export, prop, type member or language-pack key.
