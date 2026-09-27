---
'@object-ui/components': minor
'@object-ui/plugin-view': patch
---

feat(components)!: `FilterBuilderCondition` and `FilterGroup` derive from `@object-ui/types` — `operator` narrows to `FilterBuilderOperator`, the group `id` becomes optional (objectui#9306)

⚠️ Breaking at compile time, marked `minor` under this repo's version-alignment
rule. Nothing the component renders or emits changes.

`@object-ui/components` declared its own `FilterBuilderCondition` and
`FilterGroup` beside the ones `@object-ui/types` declares: the same two names,
twice, with nothing tying them together. The maintainer's ruling on objectui#9306
makes the `@object-ui/types` declarations the one name authority, which settles
objectui#6349's two parked name-authority rows. The component now derives both
and restates only its named extensions:

- `FilterBuilderCondition` takes `id` and `field` from the authority and
  restates `operator` and `value`. `operator` is `FilterBuilderOperator` (the
  protocol's operator ids plus the opt-in `exists` / `notExists`, exported by
  that name) instead of `string`, so a row carrying an id no dropdown entry can
  hold no longer type-checks. `value` keeps the component's own required
  scalar-or-list union rather than the authority's `value?: any`, so the
  exported value helpers keep their typing.
- `FilterGroup` takes `id` and `logic` from the authority and restates
  `conditions` as the component's rows. So `id` is now OPTIONAL, as the
  authority declares it. That matches what the builder does: `onChange` hands
  back the group the host passed, so an id-less group comes back id-less, and
  only the builder's own empty group carries `id: 'root'`. `conditions` is flat,
  as the authority now is (nested sub-groups are retired there, see the
  `@object-ui/types` changeset).

**Who is affected:** TypeScript code that builds a `FilterGroup` or
`FilterBuilderCondition` from `@object-ui/components` with an operator typed
`string`, or that reads a group's `id` as a guaranteed `string`. Narrow the
operator to `FilterBuilderOperator` (its members are the protocol's canonical
ids), and handle an absent group `id`.

`@object-ui/plugin-view`: `toFilterGroup` returns the narrowed `FilterGroup`.
A stored spelling it cannot map is still carried through verbatim (so the row
stays visible), and its type is asserted at that one boundary; the function's
output is unchanged.

Pinned in `packages/components/src/__tests__/filter-builder-name-authority-9306.test.tsx`.
