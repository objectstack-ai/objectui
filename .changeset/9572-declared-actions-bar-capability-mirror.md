---
'@object-ui/app-shell': patch
---

`DeclaredActionsBar` now mirrors ADR-0066 D4 `requiredPermissions` as a UI hide
(objectui#9572).

`@objectstack/spec` declares `requiredPermissions` as "enforced with 403 on the
platform action route (script/flow/modal + MCP) and **mirrored as a UI hide**".
This bar filters its own action list instead of routing through
`ActionEngine.getActionsForLocation`, so the engine's gate never reached it and
the declared key was inert on every action it drew — the one remaining
object-bound surface that did not mirror it, after `action:bar`, the grid row
menu, the selection bar and the data-table row menu (objectui#9623).

The shared `useCapabilityGate` is now applied **once** to the located set,
inside the bar's own `<ActionProvider>` — the provider `useConsoleActionRuntime`
seeds with the same `user.systemPermissions` the engine reads, and the same one
the dispatch this bar makes will carry. A gate called in the bar's outer body
would read a different provider (the host's, or none at all in a standalone
host) and fail open forever, so the placement is pinned by the new suite rather
than left to review.

Nothing is enforced in the console and no request changes: the server remains
the sole authority and still answers 403. Unknown capabilities fail **open**
(an absent `systemPermissions` is not a denial), an empty held set means "holds
nothing" and gates normally, and because the capability gate is ANDed in front
of the existing fail-closed `visible` CEL the composition is monotone — it can
only ever hide more than before, never expose something that was hidden. The
approvals admin-override affordance (objectui#5178) is unchanged: `can_override`
is a per-record viewer flag an action's own `visible` reads, `requiredPermissions`
is a per-caller capability list, and an override-only viewer gets neither an
exemption from a declared capability nor any new exposure.

Applying the gate to the list rather than per button also keeps the toolbar
chrome and the buttons reading one filtered source, so a wholly denied set draws
nothing instead of leaving the host an orphan divider and section label.
