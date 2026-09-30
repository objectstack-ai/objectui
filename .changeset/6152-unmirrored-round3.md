---
'@object-ui/types': minor
'@object-ui/components': minor
---

feat(types): four zod mirrors declare members their TypeScript twins already declared, and `pagination` retires its `page` spelling (objectui#6152, round 3)

Four node types in `@object-ui/types` declared members that their zod mirrors in
`@object-ui/types/zod` had never heard of. Each member below is read by the node's renderer. The two
published faces answered differently for each one:

- the tolerant validator (`AnyComponentSchema`, `safeValidateSchema`) kept any value at those keys
  without examining it, so a wrong-typed value parsed green;
- the strict authoring face (`StrictAnyComponentSchema`) refused the keys outright, although the
  published TypeScript type invites them.

The mirrors now declare each member, shaped as the TypeScript type declares it:

- `form`: `fieldTabs`, `defaultFieldTab`, `fieldTabsPosition`, `fieldPanes`,
  `fieldPanesOrientation`, `fieldPanesResizable`, `fieldContainerClass`, `mobileStickyActions`. A
  tab or pane entry is judged member by member.
- `detail-view`: `primaryField`, `summaryFields`, `autoTabs`, `defaultTab`, `sectionGroups`,
  `highlightFields`. A section inside a section group is not judged on that key, which is the
  same policy as the `object-form` mirror's section `fields`.
- `report`: `conditionalFormatting`, so a `report-viewer` node's `report` judges its rules too.
- `pagination`: `currentPage`.

What an author sees change:

- **Strict authoring face.** A document using any of these keys is no longer refused for them. The
  catalog's basic pagination example, for example, now parses strict.
- **Tolerant face (breaking for invalid documents).** A value of the wrong type at one of these keys
  is now refused at the key, where it used to be kept unexamined. Examples are an unknown
  `fieldTabsPosition`, a `fieldTabs` entry without `key`, a `highlightFields` entry with an unknown
  `type`, or a formatting rule with an unknown `operator`.

**`page` on a `pagination` node is retired (breaking).** It was a second spelling of `currentPage`,
read only as a fallback behind it, and no document in this repository authored it. It is retired
at once, with no alias window:

- `PaginationSchema.page` is now `?: never` on the TypeScript type, so writing it is a `tsc` error;
- both zod faces refuse it by name, and the refusal says to rename the key to `currentPage`;
- the `pagination` renderer in `@object-ui/components` no longer reads it, so a node that still
  carries only `page` renders page 1.

Rename `page` to `currentPage` on any `pagination` node. `@object-ui/types` and
`@object-ui/components` are in the fixed release group, so this ships as a minor bump, per the
repository's version policy.

Two `object-form` members stay declared and unmirrored on purpose, and no published surface
changes for them: `open` (dialog state that only in-code hosts set) and `submitHandler` (a function
slot; objectui#6182 rules handlers runtime-only). Several other declared members of these node types
are also still unmirrored, each for a stated reason recorded on objectui#6152. No other TypeScript
declaration changed.
