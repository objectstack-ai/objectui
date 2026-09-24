---
'@object-ui/types': minor
---

feat(types): `AppComponentSchema`, `DashboardComponentSchema` and `PageNodeSchema` take the spec by reference, like their zod mirrors

The three published zod mirrors have long taken `@objectstack/spec`'s `App` / `Dashboard` /
`Page` surface by reference (`BaseSchema.extend(SpecXFields.shape)`), while their hand-written
TypeScript twins restated only the members the renderers read. So the published validator
admitted keys the published type did not declare: the package-lock envelope (`_lock`,
`_lockReason`, `_lockSource`, `_provenance`, `_packageId`, `_packageVersion`, `_lockDocsUrl`,
written by the packaging pipeline), `protection`, the app's `isDefault` / `_unpublished` /
`defaultAgent` / `contextSelectors`, and the page's `source` / `interfaceConfig` / `requires`.
The spec's retirement tombstones reached the type only as `any`, through `BaseSchema`'s index
signature.

Each twin now extends `Omit` over the spec's exported input type, and that `Omit` reads the same
`as const` exclusion array the mirror's `specFieldsExcept` call reads. The two faces therefore
project one spec surface, and a later spec bump moves both of them together:

- **Admitted keys are declared** with the spec's own member types. A reader of a served document
  can read `app.protection`, `page.requires` or the envelope without a cast.
- **Tombstones refuse at compile time.** `version`, `homePageId`, `objects`, `apis`, `sharing`,
  `embed`, `mobileNavigation` and `aria` on an app, and `aria`, `refreshInterval` and
  `performance` on a dashboard, are now optional members typed `undefined`. Authoring a value is
  a TypeScript error, which is the verdict the validator already gave at parse. ⚠️ This is the
  one breaking edge: code that wrote one of these keys used to compile against the index
  signature and was refused at parse. It is now refused by `tsc`, before it runs.
- `DashboardComponentSchema.header` and `PageNodeSchema.slots` keep their own hand-written types.
  Both are withheld from the spec projection on the type side only, because neither type is
  assignable to the spec's member. The drift is already recorded in the parity ledgers.
  `PageNodeSchema.assignedProfiles` is withheld the same way, but for forward compatibility:
  objectstack `main` retires the key, and the hand-written `string[]` member (unchanged) would
  otherwise stop compiling at the next spec bump. Its retirement is tracked separately.

Why this is a minor bump: the published type surface gains members, and one authoring
spelling moves from a parse-time refusal to a compile-time refusal. This repo marks breaking
semantics `minor` rather than `major`.

This change affects types only. It changes no runtime code and narrows no mirror.
