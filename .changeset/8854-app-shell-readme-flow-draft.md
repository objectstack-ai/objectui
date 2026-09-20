---
'@object-ui/app-shell': patch
---

The package README's **Visual flow canvas** draft can now be saved. It is parsed on every test run by the schema that actually validates it, so it cannot silently rot back into an example the runtime refuses (objectui#8854).

`README.md`'s flow fence is captioned "a `flow` draft" and is the thing a reader
pastes into the metadata admin. It could not be saved, for three independent
reasons in one block:

- **The retired `ui` geometry spelling.** The fence taught
  `"ui": { "x": 220, "y": 180 }`, labelled *"optional persisted canvas
  position"*. The spec's flow node is a strict object whose canonical geometry
  key is `position`; `ui` is not among its declared keys, so the node was
  rejected by name. The README's own prose, twelve lines below the fence, already
  said exactly that — "a draft that still carries `ui` fails client-side
  validation and is rejected on save with a 422" — so the two halves of one
  section contradicted each other and the half a reader copies was the wrong one.
  Renamed to `position`, which the same prose documents as requiring **both**
  coordinates.
- **Every edge omitted `id`.** `FlowEdgeSchema` declares `id` required beside
  `source` and `target`; all four documented edges carried only `source` /
  `target` plus their branch keys. Each edge now carries one (`e1`…`e4`, matching
  the shape the repo's own `buildFlowSkeleton` writes).
- **The draft carried no identity keys.** `FlowSchema` requires `name`, `label`
  and `type`, and the fence had none of the three — so even with the two defects
  above repaired, a pasted copy was still refused three times over. The block now
  opens with them, in the shape `buildFlowSkeleton` emits, and follows the
  `// flows/renewal_reminder.json` path-comment convention this README already
  uses for its object draft.

**Which door was measured.** Not the server, and not the node and edge schemas
one at a time: the app-shell metadata admin validates a `flow` draft client-side
by handing the **whole** draft to the spec's `FlowSchema` —
`clientValidation.ts`'s `LOADERS.flow` resolves it and `ResourceEditPage` calls
`validateMetadataDraft(type, draft)` with the editor's entire body. Graded per
node and per edge, this block would have reported green while still being refused
on save; that is how the identity keys stayed invisible to two previous cards
against this same fence.

Two prose corrections ride along, because a fixed block beside stale sentences is
the same defect pointed the other way. The section now names the client-side door
under the fence, and the **Edges** bullet documents `id` as required and records
that a bare `condition` string is widened to the ADR-0089 expression envelope on
parse (`{ "dialect": "cel", "source": … }`) — measured, not assumed. The
**Layout** bullet was re-read against the installed spec and is unchanged: it was
already correct, and the `ui`-is-refused sentence it ends on now agrees with the
block above it instead of contradicting it.

No runtime behaviour changes. `src/views/metadata-admin/previews/readme-flow-canvas-draft.test.ts`
extracts the fence from the README on every run — never a hand copy, which would
drift from the file it claims to pin — strips its jsonc comments string-aware and
parses it with `FlowSchema`. Three controls re-inject the three repaired defects
into the extracted draft and require the parse to refuse each by name, so the
green cannot come from a schema that accepts everything.
