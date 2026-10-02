---
'@object-ui/types': minor
'@object-ui/layout': minor
'@object-ui/mobile': minor
'@object-ui/core': minor
---

Re-home the breakpoint layout vocabulary and delete the two dead responsive
implementations (objectui#7580, maintainer ruling 2026-09-04, option A).

**Breaking, deliberately, in one direction only.** `@objectstack/spec` retired its whole
`ui/responsive` vocabulary in objectstack#11027 — `ResponsiveConfigSchema`,
`BreakpointName`, `BreakpointColumnMapSchema` and `BreakpointOrderMapSchema` — on the
stated ground that the four types "had no other authorable carrier". That ground is
measurably false on the renderer side: `responsive-grid` is a REGISTERED SDUI component
whose authorable `columns` input is typed by `BreakpointColumnMap` and applied by
`resolveColumnClasses` on the render path, and `BreakpointName` types four live readers in
`@object-ui/mobile`. The tombstone's own return condition — the vocabulary "returns if and
when a renderer implements it" — is already met here, so the two types a renderer reads
are re-homed rather than retired.

What survives, under the same names and the same members:

- `BreakpointName` (`xs`…`2xl`) is now declared in `@object-ui/types` (`mobile.ts`) instead
  of re-exported from the spec. **No consumer change**: same name, same six members, same
  export sites on `@object-ui/types` and `@object-ui/mobile`. Only its provenance moved.
- `BreakpointColumnMap` is now declared in `@object-ui/layout` (`ResponsiveGrid.tsx`),
  verbatim from the retired `$strict` schema: six optional column counts, no index
  signature. `responsive-grid`'s `columns` input and its resolver are unchanged.

What is removed:

- `BreakpointOrderMap` (`@object-ui/layout`) — retired with the key, not re-homed. It had
  no read point in the package; it was published only because the retired
  `ResponsiveConfigSchema` paired it with the column map, so an author configuring `order`
  needed the type. With the schema gone there is no order vocabulary for it to be the type
  of, and re-declaring it would be the declare-without-enforce shape ADR-0049 removes.
- `useResponsiveConfig` (`@object-ui/mobile`), with its `SpecResponsiveConfig` and
  `ResolvedResponsiveState` exports, and `ResponsiveProtocol` (`@object-ui/core`), with
  `resolveResponsiveConfig` / `getVisibilityClasses` / `getColumnClasses` /
  `getOrderClasses` / `shouldHideAtBreakpoint`. Both read the retired
  `ResponsiveConfigSchema` and both were measured at zero callers (objectui#4773).
- `SpecResponsiveConfig` / `SpecBreakpointName` (`@object-ui/types`) — dead re-exports once
  the two implementations above went, dropped rather than re-declared locally, the same
  disposition the retired i18n names in that file already carry.

No behaviour is retired. The live per-breakpoint readers — `useBreakpoint`,
`ResponsiveContainer`, `BREAKPOINTS` / `BREAKPOINT_ORDER` / `getCurrentBreakpoint`, and
`responsive-grid` itself — are untouched.

**Sequencing.** objectui's next `@objectstack/spec` pin bump must carry `Blocked-by:`
objectui#7580: the retirement is merged upstream and unreleased, so this must land first.

⚠️ **Dated note, 2026-10-02 — the `responsive-grid` registration is retired — objectui#11441.**
Later in this same release the maintainer's ruling on objectui#11441 (letter B) unregistered `responsive-grid` (and
`layout:responsive-grid`). That ruling updates item 2 of this change's ruling: the vocabulary half stands, so
`BreakpointName` and `BreakpointColumnMap` stay declared here, and `ResponsiveGrid` stays a React export whose
`columns` prop `BreakpointColumnMap` types. The authorable breakpoint grid is the `grid` node with a breakpoint
`columns` object, which `BreakpointName` keys. The rest of this entry is kept as the reading of this change.
