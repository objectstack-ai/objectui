---
'@object-ui/app-shell': patch
---

Flow designer: adding a branch to a Decision no longer overwrites the condition of its existing connection (objectui#13138).

When a Decision's connection carried its own routing (a condition written in the connection inspector), "Add branch" stamped the new branch onto that connection: its condition was deleted and it became the default path, without a word. Picking the new branch's target first claimed the same connection because it pointed at the same node. The Branches reconciliation now pairs a branch only with the connection it names (by condition, label or default flag), with a connection that carries no routing of its own, or with a connection the stored branches already drove before the edit. A new branch that names no connection stays a branch without one until its target is chosen, and then gets its own connection; it also never removes a default connection it did not wire. Editing an existing branch still updates its own connection. The Branches list also keeps showing every connection no branch is paired with, beside the branches, so adding a branch no longer hides the connection it used to list.
