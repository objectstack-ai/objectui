---
'@object-ui/react': minor
'@object-ui/components': minor
'@object-ui/types': minor
---

Unbind the data-source adapter from the expression scope, and point `bind` at the scope
channel (objectui#9308, maintainer ruling 2026-09-13, option B).

**Breaking, deliberately — and `minor` only because this repo's `fixed` group of 40
packages may not carry a `major` (AGENTS.md 版本号策略).** Read the migration note below
before upgrading if any of your metadata reads `data.*` at the page/component tier.

**What changed.**

1. `SchemaRenderer` no longer writes `data: dataSource` into the evaluator scope. `data`
   is not a root this tier binds. The roots it supplies are `record` (the row, when a
   record surface bound one), `page` (page-local variables) and `current_user` — plus
   every name the host published through `PredicateScopeProvider`.
2. `useDataScope(path)` — what a node's `bind` resolves through — reads the ambient
   predicate scope (`usePredicateScope()`) instead of walking the injected adapter.

**Who this breaks, concretely.**

* **A `${data.…}` expression on a page/component node.** It used to resolve against the
  host's injected `DataSource` adapter. An adapter answers no `data.*` path, so for every
  host that injected a real adapter the read was already `undefined` and the predicate was
  a silent constant — but the constant MOVES: `data` used to be a present key holding an
  object, so `data.status == 'draft'` evaluated cleanly to `false` and the node was hidden
  on every row. `data` is now ABSENT, the expression cannot be evaluated at all, and this
  surface is fail-soft, so the same gate now answers `true` and the node is SHOWN on every
  row. It is no longer silent: the objectui#5454 reporter names it in the console, in
  production as well as development. Re-root such a predicate on `record.*` — the row —
  or publish a `data` of your own through `PredicateScopeProvider`.
* **A host that injected a plain data bag as `dataSource`.** That was meaning 2 of the
  key, and it stops working entirely: `${data.…}` no longer reads it and `bind` no longer
  walks it. It has been a compile error since objectui#7912 (`dataSource` is typed
  `DataSource | null | undefined`). Publish those values through `PredicateScopeProvider`
  instead — the provider, the hook and the app-shell wiring already exist, and this change
  adds no new published key.
* **The nine `bind` readers** (`list`, `tree-view`, `ObjectChart`, `ObjectDataTable`,
  `ObjectPivotTable`, `ObjectGrid`, `ObjectKanban`, `ObjectGallery`, `ObjectTimeline`) now
  resolve `bind` against the scope. All nine already carry a fallback
  (`boundData || schema.items`, `|| schema.nodes || []`, or a fall-through to their own
  fetch chain), and against a conformant adapter `useDataScope` returned `undefined`
  before this change — so the fallback is what was running, and a `bind` that resolved
  nothing before still resolves nothing. What is new is that a `bind` CAN now resolve:
  a host that publishes rows on its scope will see them used where the fetch used to run.

**Why.** `@object-ui/app-shell`'s `ExpressionProvider` states the rule this applies: every
root bound at a tier must be one the engine accepts AND one that tier can actually answer.
objectui#8155 unbound `app` under it and objectui#8166 unbound `data`; ADR-0089 D3 puts
`data` at the metadata layer and `record` at the runtime layer, and the engine's
per-surface `FIELD_RULE_BOUND_ROOTS` is `['record','previous','parent']`. The renderer tier
was the last one still binding a root it could not answer.

Two side effects worth naming. A host that legitimately published `data` through the
documented scope channel used to be silently overwritten by the adapter (the adapter was
spread last); it is not any more. And `reportAdapterOnlyDataPredicate` now resolves against
the `data` the evaluator actually bound rather than against the adapter — left pointing at
the adapter it would have gone silent for precisely the hosts this change breaks.

The Data Context passages of `content/docs/guide/schema-rendering.md` and
`packages/react/README.md` teach the scope channel accordingly.
