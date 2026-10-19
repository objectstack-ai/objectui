---
"@object-ui/types": minor
"@object-ui/components": minor
"@object-ui/app-shell": minor
"@object-ui/console": minor
"@object-ui/runner": minor
---

Build `@objectstack/*` from objectstack `main` `2ec6827962` (objectui#12971).

`.objectstack-sha` moves from `2c9bf9430a`, the commit `@objectstack/spec` `18.0.0-next.3` was released from, to `2ec6827962`, a commit on objectstack `main` whose packages read `18.0.0-next.4`. The console and the runner bundle `@objectstack/*` built from it. No package's `@objectstack/*` range changes.

Clause-②: no (narrowing)

**Accept sets that narrow with it.** `@object-ui/types` validates a page through the spec's own page checks, so `safeValidateSchema`, `StrictAnyComponentSchema` and `objectui validate` now refuse:

- A region named `main` with `width: 'small'`, `'medium'` or `'large'`, on a `page` node and on a page-kind node (`type: 'record'`, `'home'` or `'utility'`). FROM accepted on both faces TO refused at the region's `width`, with the spec's message (`checkPageMainRegionWidth`). No layout reads those three values on `main`; the template decides its width. Delete `width` to keep the page as it renders, or write `width: 'full'` for a full-bleed page. Other regions keep all four values.
- A `record` binding on a page-kind node. FROM kept unvalidated by `safeValidateSchema` and refused as an undeclared key by `StrictAnyComponentSchema` TO refused on both at `record`, with the spec's message (`checkPageRecordBindingPlacement`): only a `type: 'app'` page binds a row. The check reads the page kind from `type`, so it does not judge a `page` node, whose kind is `pageType`.

**A published input that leaves.** `action:button` and `action:icon` no longer publish a `patch` input. FROM published TO absent: the spec retired a page action row's own `patch`. A row's `operation: 'update'` runs the declared action its `name` names, and the platform action route writes that action's `patch`. The `operation` input's description now says so.

**Keys that arrive with the spec, by reference.** Two keys the spec added are taken by reference, so the strict face now accepts them where it refused them as undeclared. Their renderer halves are separate work:

- `emptyState` on `record:details`, `record:highlights` and `record:quick_actions`.
- `record` on a `page` node.

**A palette exclusion that goes.** `record:json` is retired in the spec and is no longer a page component type, so the page designer's palette drops its exclusion entry. Nothing the palette offers changes.
