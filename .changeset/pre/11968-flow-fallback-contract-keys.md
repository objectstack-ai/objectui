---
'@object-ui/app-shell': patch
---

Studio's flow-node inspector, in its fallback form, writes only config keys the node's contract declares (objectui#11968).

The fallback form is the hand-written field table the inspector renders when the engine has published no config schema for a node type: while `GET /automation/actions` is loading, and when that call fails. Two of its groups wrote keys their contract does not declare:

- **HTTP request.** The group offered an **Output variable** row that wrote `config.outputVariable`. The `http` executor never reads that key, its contract does not declare it, and the engine refuses to register a flow that carries it. An author who filled it in on the fallback form saved a flow that then never registered. The row is gone, as it is on the online form, which never offered it.
- **Notify.** The **Click-through URL** row wrote `config.url`, a converted spelling of `actionUrl`. It now writes `actionUrl`, the key the contract declares and the online form writes.

A flow that already stores either key still opens: the key is shown in the Advanced (JSON) block, where it can be cleared, and an unrelated edit keeps it unchanged. A new test holds every fallback group to the keys its node's contract declares, read from the installed `@objectstack/spec`.

Nothing is added to or removed from the package entry.
