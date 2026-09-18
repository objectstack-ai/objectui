---
'@object-ui/components': patch
---

Row actions in a record page's related list now honour `requiredPermissions` (objectui#9623).

A row action declaring `requiredPermissions` was **inert** inside a record page's
related-list panel: it rendered for a caller whose reported capability set was `[]`,
while the same action, the same declaration and the same build were correctly hidden on
`record_header`. Downstream (cloud#2224) a plain organization member was offered Set as
Primary / Verify DNS / Delete on an environment's domain rows and read a red 403 toast on
click.

The related list feeds a child object's `list_item` actions into the data-table as
`rowActionDefs` (`RelatedRecordActionsBridge`), and `DataTableRowActionsMenu` filters that
list ITSELF rather than routing through `ActionEngine.getActionsForLocation` — so the
engine's ADR-0066 D4 gate never reached it. It now applies `useCapabilityGate` once to the
declared set, before the menu is planned, which is verbatim the posture `plugin-grid`'s
`RowActionMenu` has taken for the standalone grid since framework#3923: the "⋮" trigger and
the items it holds read one filtered source, so a row whose every action is gated away
renders no trigger instead of an empty menu (the objectui#3562 invariant).

Nothing new is fetched or bound. The capability was already on the page — the record
surface one level up gates off the very same `<ActionProvider>`; this renderer just never
asked. Doctrine is unchanged and deliberately so: unknown still fails **OPEN** (no runner,
no user, no `systemPermissions` array → the action shows, because hiding a permitted
user's button on missing client data is the worse failure), an EMPTY reported set gates
normally, and the server remains the enforcement authority — this is a UI mirror of a
decision the server already makes, never a replacement for it.
