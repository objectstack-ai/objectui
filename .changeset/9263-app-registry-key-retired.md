---
'@object-ui/components': minor
'@object-ui/cli': minor
---

`app` is an app-document type, not an SDUI registry key — the registration is removed
(objectui#9263, maintainer ruling 2026-09-15, option A).

**BREAKING for authored metadata and for TypeScript authors.** `PageRenderer` was
registered under five names, `app` among them, while `AppComponentSchema` declares the
*same* `type: 'app'` for something else entirely: a whole application's configuration,
read by the runner/layout path. One name, two live channels, and neither declaration
mentioned the other.

**What breaks, and how you find out.** An author who type-checked a node against the
published `AppComponentSchema` and handed it to `SchemaRenderer` used to be served
`PageRenderer`, which reads the unrelated `PageNodeSchema` — every key they authored
ignored, `tsc` green, nothing thrown, the page merely missing things. That spelling is
now **refused**, loudly:

- `SchemaRenderer` paints the OBJUI-001 "Unknown component type" panel naming `app`;
- `objectui check` reports it, because `KNOWN_SCHEMA_TYPES` is regenerated from the
  registration calls themselves and no longer carries the key.

The fix is a rename in the document: `type: 'app'` → `type: 'page'`.

**Nothing that worked stops working, and no layout is lost.** The registration never
delivered the layout its `label: 'App Page'` advertised: `PageRenderer` derives its
layout from `schema.pageType`, which defaults to `'record'` and is **never** derived
from `schema.type`, so `{ type: 'app' }` has always rendered a *record* page. The app
layout was only ever reachable as `{ type: 'page', pageType: 'app' }`, and it still is —
the spelling `packages/types/src/__tests__/p1-spec-alignment.test.ts` already pins.

**The app-DOCUMENT channel is untouched.** `AppComponentSchema` keeps declaring
`type: 'app'`; `packages/runner`, `packages/layout` and the VS Code extension's file
association all read that channel and none of them changes. Retiring the declaration was
never on the table — it has a measured consumer surface — and this change is pinned in
both directions so a later "repair" in the opposite direction goes red instead of quiet.

**ADR-0087 disposition: L3 — break loudly and structurally.** L1 (a conversion layer
that silently rewrites the old shape) is **refused**, and not for cost: `app` legitimately
remains the app-document spelling, so a converter would have to guess which of two live
channels an author meant, and guessing wrong reinstates exactly the silent mis-render this
change removes. L2 (a replayable migration step) does not apply: nothing here is a
`packages/spec` shape, a `*.zod.ts` declaration or a stored row, so `objectstack migrate
meta` has nothing to reach. What is left is L3, and it is delivered as ADR-0087 D1
prescribes — a structured, machine-readable refusal at the author's own call site rather
than an arbitrary downstream failure: the named OBJUI-001 diagnostic at render time and a
named `objectui check` finding at authoring time. ⛔ No ADR-0087 ledger exemption is
claimed: D7 and D8 are objectstack ledger categories about published TypeScript
interfaces, and a registry key is neither.

**Migration, in this repository: zero authored documents.** Re-measured on this branch
rather than inherited from the card, with a firing control in the same pass. A structural
walk of every tracked JSON document and every fenced JSON block — 548 documents and 258
blocks parsed — finds **one** node spelling `type: 'app'`, and it carries `pages`, so it
is an app *document* on the other channel. The control `type: 'page'` resolves 19 nodes in
15 files in the same pass, and an absent-token control resolves 0, so the zero is a
reading. A token pass covering the residue the parser could not parse scores `app` at
**0** in `examples/**` and **0** in `apps/**`, against a control that fires in both, and
its 7 `content/docs/**` hits are each an `AppComponentSchema`-annotated document. The
repository's own registry derivation moves from 644 keys to 643, with `page`, `utility`,
`home` and `record` still resolving.

⚠️ This census covers this repository only. An out-of-repo document that authored
`type: 'app'` as a node was already being rendered from the wrong declaration; it now gets
the named refusal above instead, which is how it becomes visible.

**Also in this change**, each one forced by the removal rather than chosen:

- `packages/cli/src/utils/known-schema-types.ts` regenerated — one line, `'app'`, and
  `node scripts/regenerate-known-schema-types.mjs --check` agrees again.
- `scripts/container-declaration-baseline.json` loses its `app` row. That ledger is a
  ratchet to zero whose second assertion fails on a *listed* tag that has stopped
  violating, so the line had to go with the registration; the list only shrinks.
- `scripts/check-doc-component-types.mjs` gains three (file, value) exemptions declaring
  `app` as the app-document vocabulary on the three pages that teach it. That gate judges
  every `type` literal in a docs code block against the registry with no channel
  awareness, and objectui#8802's retirement of the bare `kanban` node key is the same
  shape, exempted the same way. ⛔ No documentation content changed.

Version note: `minor`, not `major`, per AGENTS.md §版本号策略 — objectui's major tracks the
`@objectstack` major and all publishable packages share one `fixed` group, so a breaking
removal is declared `minor` with the break spelled out here.
