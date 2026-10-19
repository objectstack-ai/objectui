---
"@object-ui/types": minor
"@object-ui/components": minor
"@object-ui/app-shell": minor
"@object-ui/console": minor
"@object-ui/runner": minor
---

Build `@objectstack/*` from objectstack `main` `f4755a68a7` (objectui#12971).

`.objectstack-sha` moves from `2c9bf9430a`, the commit `@objectstack/spec` `18.0.0-next.3` was released from, to `f4755a68a7`, a commit on objectstack `main` after the `18.0.0-next.5` release, so its packages read `18.0.0-next.5`. The console and the runner bundle `@objectstack/*` built from it. No package's `@objectstack/*` range changes.

Clause-②: yes (narrowing)

The pin moves `@object-ui/types`' accept sets both ways: keys the spec added arrive by reference and widen them, and checks the spec added narrow them. Both are listed below.

**Accept sets that narrow with it.** `@object-ui/types` validates a page through the spec's own page checks, so `safeValidateSchema`, `StrictAnyComponentSchema` and `objectui validate` now refuse:

- A region named `main` with `width: 'small'`, `'medium'` or `'large'`, on a `page` node and on a page-kind node (`type: 'record'`, `'home'` or `'utility'`). FROM accepted on both faces TO refused at the region's `width`, with the spec's message (`checkPageMainRegionWidth`), which opens: "Region `main` is refused with `width: 'large'` (since @objectstack/spec 18): a `main` region takes only `width: 'full'`." No layout reads those three values on `main`; the template decides its width. Delete `width` to keep the page as it renders, or write `width: 'full'` for a full-bleed page. Other regions keep all four values.
- A `record` binding on a page-kind node. FROM kept unvalidated by `safeValidateSchema` and refused as an undeclared key by `StrictAnyComponentSchema` TO refused on both at `record`, with the spec's message (`checkPageRecordBindingPlacement`), for example on a `home` page: "`record` binds the row of an `app` page, and this page is `type: 'home'`, which has no row to bind. Delete `record`, or make the page `type: 'app'`." The check reads the page kind from `type`, so it does not judge a `page` node, whose kind is `pageType`.

**A published input that leaves.** `action:button` and `action:icon` no longer publish a `patch` input. FROM published TO absent: the spec retired a page action row's own `patch`. A row's `operation: 'update'` runs the declared action its `name` names, and the platform action route writes that action's `patch`. The `operation` input's description now says so.

**Accept sets that widen with it.** Three keys the spec added are taken by reference, so `StrictAnyComponentSchema` and `objectui validate` now accept them where they refused them as undeclared. Their renderer halves are separate work:

- `emptyState` on `record:details`, `record:highlights` and `record:quick_actions`.
- `record` on a `page` node.
- `dataSource` on a navigation entry, every member but a separator. `NavigationItemSchema` and the `NavigationItem` type take the spec's `ElementApiDataSourceSchema` by reference; before, `NavigationItemSchema` stripped the key. The spec describes it as planned, and the console does not read it yet.

**A palette exclusion that goes.** `record:json` is retired in the spec and is no longer a page component type, so the page designer's palette drops its exclusion entry. Nothing the palette offers changes.
