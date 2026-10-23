---
'@object-ui/permissions': minor
'@object-ui/console': patch
---

An approver who is not an administrator sees the whole approval request page again: its fields, its decision panel with the decisions they may take, and its Timeline (objectui#13324).

The console reads a request, and its timeline, through the approvals routes, which serve a request to each party to it. The record page then gated what it drew on the permissions answer for the data API, which names neither approval object for a member, because the platform keeps that door closed to them. So the page folded the request down to its id, drew no decision, and dropped the Timeline. Opening a request from the Approvals inbox showed a blank page.

`@object-ui/permissions` adds `ServerReadScope`. Below it, the read verdicts for the objects it names (`check(object, 'read')` and `checkField(object, field, 'read')`) answer "allowed": whatever the server serves is what the viewer may read. Every other action, the field write and create verdicts, and every other object keep the enclosing provider's answer. The console mounts it for the two approval objects over every app. No read grant on either object is added: the data API stays closed to members.
