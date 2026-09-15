---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-gantt': minor
'@object-ui/components': patch
'@object-ui/cli': patch
'@object-ui/console': patch
'@object-ui/runner': patch
'@object-ui/sdui-parser': minor
---

Four node type keys retire, and the kanban and gantt families converge on their
`object-*` spellings: `kanban` (objectui#8802), `kanban-ui` and `kanban-enhanced`
(objectui#8257), and `gantt` (objectui#8008). All four were ruled by the
maintainer in one batch on 2026-09-09.

**⛔ No stored document moves.** The strings `kanban` and `gantt` name two
different things at two different layers, and only one of them is retiring:

| layer | value | who writes it | retired? |
| --- | --- | --- | --- |
| stored `NamedListView.type` | `"kanban"`, `"gantt"` | `CreateViewDialog`, persisted per tenant | **no — untouched** |
| node type key | `kanban`, `gantt` | hand-authored JSON | **yes** |

`ObjectView`'s `switch (viewType)` maps a stored view type onto the node type it
renders, and it already emitted `object-kanban` and `object-gantt` — as it does
for all twelve stored view types. So every kanban and gantt view any user ever
created through the console already renders through the surviving spelling.
Nothing in a tenant database changes, and ⛔ nothing should be migrated there.

**What each retirement was, measured.** Three of the four were
registration-only: no schema face in `@object-ui/types` ever declared
`kanban-ui`, `kanban-enhanced` or `gantt` as a component node type, so
unregistering is the whole retirement. The bare `kanban` key was the exception —
it had a declared arm on both faces (`KanbanSchema` in `complex.ts` and its Zod
mirror), and a plain deletion there would have been the objectui#7664 failure:
`BaseSchema` is `.passthrough()`, so a document naming a dropped key validates
green and renders nothing. It therefore retires as a **named refusal**: the Zod
union keeps an arm claiming the literal and answers a `{ "type": "kanban" }`
document with a message naming `object-kanban` as the remedy, while the
TypeScript half is the absence of the arm from `ComplexSchema` and of the key
from `SchemaRegistry`, so `tsc` refuses it at the authoring site.

**⭐ This closes objectui#8818's `objectFields` hole — for that ENTRY, not for
the class.** `SchemaRenderer` strips a fixed enumerated metadata list and
spreads the rest as React props; `objectFields` is not on that list, and
`KanbanRenderer` — the component the `kanban-ui` key resolved to — declares
`objectFields` as a real prop, so an authored value reached the predicate layer
with no schema face judging it. With the registration gone, no authored node
reaches that component through the registry. ⚠️ The **class** is still open: the
hole returns the moment another registered renderer declares an `objectFields`
prop. objectui#8818's option (a) — stripping at the `SchemaRenderer` boundary —
is what would close the class.

**⚠️ What the `kanban` arm took with it, stated because it is the cost of this
change.** That arm was the only schema face that ever declared `columns`,
`cardTitle`, `swimlaneField`, `grouping` and `navigation`, the only one that
refused `allowCollapse` / `cardTemplates` / `columnWidths` / `titleField` /
`draggable` / `onColumnAdd` / `onCardAdd` by name, and — through
`columns: KanbanColumn[]` — the only one that judged a lane's `cards`
(objectui#6939). The surviving `ObjectKanbanSchema` face declares none of them.
⛔ Nothing about an `object-kanban` document changes: it was never judged by the
`kanban` arm, so all of those keys have always ridden `BaseSchema`'s index
signature there. What is gone is the `kanban` document that had them. Declaring
them on `ObjectKanbanSchema` would WIDEN a published accept set, which is a
maintainer ruling and not part of this one; every one of these readings is
pinned where it can be seen rather than left to be rediscovered.

**Migrating.** Replace `"type": "kanban"` with `"type": "object-kanban"` and
`"type": "gantt"` with `"type": "object-gantt"` in hand-authored documents. The
`object-kanban` face requires `groupBy` and one of `bind` / `data` /
`objectName`; a purely static board (lanes carrying their own cards, no record
source) adds `"groupBy"` and `"data": []`. `kanban-ui` and `kanban-enhanced`
have no authored documents anywhere in this repository to migrate.

**⚠️ The namespaced spellings retire with the registrations — `view:kanban` and
`view:gantt` are the same two keys.** `ComponentRegistry.register(type, C,
{ namespace })` stores BOTH `namespace:type` and a bare-`type` fallback, so
every one of these keys had a namespaced twin that goes with it:

| retired spelling | namespaced twin | author instead |
| --- | --- | --- |
| `kanban` | `view:kanban` | `object-kanban` |
| `gantt` | `view:gantt` | `object-gantt` |
| `kanban-ui` | `plugin-kanban:kanban-ui` | `object-kanban` |
| `kanban-enhanced` | `plugin-kanban:kanban-enhanced` | `object-kanban` |

Both spellings are pinned as gone, each against a firing control on the
surviving key, in `plugin-kanban/src/__tests__/kanban-family-registry-keys-retired-8257.test.ts`
and `plugin-gantt/src/__tests__/bare-gantt-node-key-retired-8008.test.ts`.

**What an unmigrated `view:kanban` / `view:gantt` node now renders depends on
the host.** In `apps/console` it renders the protocol **placeholder** panel, not
the OBJUI-001 "Unknown component type" error: the console calls the opt-in
`registerPlaceholders()` (`@object-ui/components`, `renderers/placeholders.tsx`)
*after* its plugin registrations, `view:kanban` and `view:gantt` are both in
that file's `PROTOCOL_COMPONENTS` list, and the placeholder only claims a key
nothing else has taken — which, until this change, `@object-ui/plugin-kanban`
and `@object-ui/plugin-gantt` had. In every other host, which does not call that
bootstrap, the same node renders OBJUI-001.

**⚠️ `objectui check` will NOT flag either namespaced spelling.** The CLI's
`known-schema-types.ts` is generated from the repository's real registration
calls, and the placeholder registration is a real one — so `view:kanban` and
`view:gantt` are still on that list and still validate green, while the node
renders a placeholder rather than a board. The bare `kanban` / `gantt` entries
DID leave the generated list; only the namespaced pair survives, and only
because of the placeholder. Grep your documents for the namespaced spellings
directly; do not rely on `objectui check` to find them.

`KanbanRenderer` is still exported from this package's entry point
(`@object-ui/plugin-kanban`); only its registry key is gone. ⚠️ `KanbanEnhanced`
is a different case, and the earlier draft of this note stated it wrongly: this
package's `exports` map has exactly two entries — `.` and `./style.css` — and
the barrel never re-exported the component, so
`@object-ui/plugin-kanban/KanbanEnhanced` has never been a resolvable specifier
for a consumer. With `kanban-enhanced` unregistered, `KanbanEnhanced.tsx` has
zero non-test importers. ⛔ The file is deliberately left in place: deleting
published-but-unreachable source is a further narrowing and needs its own
maintainer ruling, which this change does not have.

**⚠️ `@object-ui/sdui-parser`: `QUICK_ADD_HOST_TYPES` loses `kanban` with the
registration.** The `inert-quick-add` diagnostic (objectui#8285) named the two
tags `ObjectKanbanRenderer` answered to; one of them retires here, so the set is
now `{ 'object-kanban' }`. ⛔ Nothing is silently dropped by that narrowing, and
this is measured rather than argued: `checkKanbanQuickAdd` has exactly one call
site — `validate.ts`'s per-prop walk — and that walk runs only in the branch
where the manifest RESOLVED the tag. A tag no registration produces is answered
one level up by `unknown-component`, an **error**, and its props are never
walked, so on a manifest built from the live registry a `<kanban quickAdd>` node
draws `error/unknown-component` and nothing else, against a firing control on
`<object-kanban quickAdd>` that still draws `warning/inert-quick-add`. Keeping
`kanban` in the set would have been reachable only through a hand-built manifest
declaring a component of that name — which, after this retirement, is somebody
else's component, and the message asserts things about `ObjectKanban` that would
be false of it. This supersedes the `kanban` half of the objectui#8285 entry.

**The diagnostic's remedy text moves from a tag to a component.** It used to end
"render `<kanban-ui>` from a React host that passes `onQuickAdd`". That sentence
is falsified by this change: `kanban-ui` is no longer a node type key, so a page
written to the old advice draws `unknown-component`. It now names
`KanbanRenderer` from `@object-ui/plugin-kanban` — still exported, still
forwarding both halves by identity — which is the surviving way to get the pair.
`content/docs/plugins/plugin-kanban.mdx` says the same thing the same way.
