---
'@object-ui/types': minor
---

Refuse `breadcrumbs` by name on the `page` node (objectui#8871, ADR-0049 enforce-or-remove).

**Accept-set change, deliberately.** A `page` document carrying `breadcrumbs` used to parse
GREEN and render nothing. `PageNodeSchema` never declared the key and no renderer ever read
it, so the array survived purely through `BaseSchema`'s `.passthrough()`. On the TypeScript
face, `tsc` **previously accepted** it too, through `BaseSchema`'s own `[key: string]: any`
index signature (`packages/types/src/base.ts:467`) — the same open door the zod mirror
walked through at runtime. It now fails at parse with the remedy in the message, and the
TypeScript twin is `breadcrumbs?: never`, so `tsc` refuses it at the authoring site before
anything runs — both faces narrow together.

**Why ADR-0049 and not a fresh ruling.** objectui#7926 refused `actions` on this same node
and, by its own comments, ruled on that key ONLY — its ruling is not borrowed here. What
reaches this key is the standing enforce-or-remove gate, which this repository applies to
this exact face: `packages/types/src/zod/tombstone.zod.ts`'s `retirementTombstone` is
documented as the "ADR-0049 RETIREMENT TOMBSTONE" helper and is internal to these zod
modules, 63 changesets cite the ADR, and `PageNodeSchema` already carried one of its refusal
arms one member up. objectui#7926 left this key parsing on purpose so that retiring it would
be a decision rather than an accident, and wrote a pin saying so; that pin is **flipped**,
not deleted.

**What was measured, on this branch's base `93127bd6f`.** Zero readers, with a **point-access**
probe rather than a bare word: on that base `\.breadcrumbs` scores 0 tree-wide (exit 1) against
`\.breadcrumb\b`'s **12** files tree-wide (**10** under `packages/`) as the lit control. At head
the same two probes read 16 and 13 and `\.breadcrumbs` is exit 0 over 4 files — every hit one of
this branch's own four files (this changeset, the refusal pin, `layout.ts`, `zod/layout.zod.ts`)
quoting the probe string, and the pin's own exclusions put head back at exit 1. The base reading
is the measurement; the head reading is this branch's echo of it. The bare word would have lied — it also names
Sentry's own unrelated concept (`app-shell/src/observability/sentry.ts`) and appears in two
comments listing UI surfaces (`core/src/utils/record-title.ts`,
`layout/src/NavigationRenderer.tsx`), so a bare probe reports five readers that do not exist.

Three author sites, all teaching passages in `content/docs/guide/layout.md`, and that count
**corrects objectui#7926's "1 site"**: its census reads every git-tracked JSON file, every
`json` fence in `.md`/`.mdx`, and every TS/TSX object literal via the TypeScript AST (PR
#8870), and it undercounted for **two different reasons**. The Schema API block declared
`breadcrumbs?: Array<{ label, href }>` outright and its literal does carry `type: 'page'`, but
that literal sits inside a markdown `typescript` fence — a fence **language** the census's
`json`-fence reader never visits, so it was never read at all. Best Practices §2 authored it
on a fragment inside a `json` fence the census does read, but that fragment never writes
`type`, so a `page`-tagged filter correctly excluded it. No example app, catalog fixture,
template or customer document writes the key, so the refusal strands no authored document in
this tree.

**Migration** — the trail is a NODE, and it already ships:

```json
{
  "type": "page",
  "title": "Acme Corporation",
  "body": [
    {
      "type": "breadcrumb",
      "items": [
        { "label": "Home", "href": "/" },
        { "label": "Customers", "href": "/customers" },
        { "label": "Acme Corporation" }
      ]
    }
  ]
}
```

`breadcrumb` is a registered renderer taking the same `{ label, href }` item shape the
retired key carried, plus `separator`, `maxItems` and a per-item `icon`. ⛔ Not the
`page:header` block's `breadcrumb`, which is **singular** and a **boolean** display toggle
rather than a list of links — the guide's own "There is no `breadcrumbs` array" passage is
about that component, and is unchanged.

**Why a refusal and not a deletion.** There was nothing to delete: the key was never in the
shape, and under `.passthrough()` an undeclared key is not refused, it is KEPT. Declaring the
refusal is what makes it audible, and what converts a write from OUTSIDE this repository —
the half no in-tree census can read — into a named refusal carrying its own remedy.

**Scope.** One key, by name; the node is **not** strict. Only 2 of the 23 passthrough-
surviving undeclared keys land on a real SDUI `page` node (`actions` and this one); the rest
belong to different declarations that merely spell `type: 'page'`. Strictness would also have
reddened a living pin — `page-app-dashboard-spec-parity.test.ts`, "the component envelope
still passes unknown renderer props through" — which stays green and is re-asserted from this
card's side.

Marked `minor`. This card carries `Clause-②: yes`, declared on the dispatch claim, and this
changeset's own lead sentence is *"Accept-set change, deliberately"* — the reading AGENTS.md's
版本号策略 gives `minor` for objectui's own breaking changes. objectui#7926's `patch` does not
transfer here: its ruling was **specified** with `Clause-②: no`, a different premise, so
citing it for the level would import that ruling's conclusion without its premise. The
precedent that literally shares this card's `Clause-②: yes` reading is **objectui#5905**, where
the declaration is explicit on the card and both changesets took `minor`. Two further
retirements of the same shape also took `minor` but do **not** carry the declaration, so they
corroborate the level and ⛔ not the clause reading: objectui#4919 (a published TS type removed,
but the card pre-dates the `Clause-②:` spelling entirely) and objectui#5453 (no Clause-②
declaration, and its own ACCEPT record measured that narrowing as *"not consumer-visible"*).
