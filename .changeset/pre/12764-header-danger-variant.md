---
'@object-ui/components': patch
---

fix(components): `page:header` reads the spec's `variant: 'danger'` as destructive (objectui#12764)

Clause-②: no

`@objectstack/spec`'s action `variant` enum is `primary | secondary | danger | ghost | link`, and its description says "danger = destructive". `page:header` read destructive only as Shadcn's `destructive` or the host's `sys_delete`, so a `variant: 'danger'` action (an organization page's "Leave organization") placed first drew as the filled primary button, and folded into the `⋯` it had no red row and no separator. One predicate now decides destructive for the whole header, and its word is the spec's `danger`:

- a `danger` action is never the filled primary; the primary is the first non-destructive action, or the one declaring `variant: 'primary'`;
- shown inline, it is drawn as Shadcn's `destructive` button instead of an outline button;
- folded into the `⋯`, it is a red row in the destructive band, below the separator, beside the host's Delete.

`variant: 'destructive'` on a header action is no longer read as destructive: it is not a spec value, and the spec's action schema refuses it. The host's Delete is matched by its name, `sys_delete`, so it keeps its red row below the separator. No prop, export or type member changes.
