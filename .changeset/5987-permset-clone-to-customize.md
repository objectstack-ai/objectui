---
'@object-ui/app-shell': patch
---

feat(app-shell): a package-provided permission set offers "Clone to customize" as its primary action, and names it first (objectui#5987)

The permission matrix already locks a set a code package ships (the artifact
tier: `isArtifactBackedLayer`, the client mirror of the server's
`isArtifactBacked`), and its guidance offered only the pre-ruling remedies —
edit the source artifact and redeploy, a new runtime set, the
`OS_METADATA_WRITABLE` hatch. The ruled path (objectstack#11513, 「同意 第一步
(创业阶段,Salesforce 式)」: lock the base, clone to customize) was never on the
screen, although the server's own `403 not_overridable` refusal names it.

The locked editor now renders **Clone to customize** in the slot Save would
occupy. It runs the `clone_permission_set` record action the server publishes
on `sys_permission_set` — resolved by name off the object definition the
console holds, the set's row stashed under `params._rowRecord`, the declared
`params` surfaced to the runner's dialog — through the console's shared action
runner, so the clone's payload, dialog and toasts are the published action's,
not a copy assembled here. On the routed metadata admin the returned clone is
opened (`../<name>`), where it loads with no code layer and is writable; an
embedded host is told the clone's name. A server that publishes no such action,
or a set with no `sys_permission_set` row, gets a refusal naming what is
missing — never a fallback clone. The lock's guidance names cloning first, with
the former remedies kept as secondary routes.

A save that still reaches the server and is refused `403 NOT_OVERRIDABLE` at the
environment door now shows the same guidance beside the refusal, with the same
primary action, keyed on the refusal's code rather than its prose; it used to
surface the transport's sentence alone.

Lock predicate unchanged — no second predicate was added.
