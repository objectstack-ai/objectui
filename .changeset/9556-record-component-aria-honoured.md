---
'@object-ui/types': minor
'@object-ui/plugin-detail': minor
---

`record:*` blocks honour the `aria` bag the protocol declares on them, and
`RecordComponentAriaProps.ariaLabel` states the contract's inline locale
vocabulary instead of narrowing it to `string` (objectui#9556).

## What an author could write, and what happened to it

`@objectstack/spec`'s props schema for `record:details`, `record:highlights`,
`record:related_list`, `record:activity`, `record:chatter` and `record:path`
each declares an `aria` bag, so a document carrying
`aria: { ariaLabel: 'Account overview' }` on any of them **parses green at
publish**. None of those six renderers put it anywhere a user could reach: five
read the key not at all, and `record:path` read `(schema.aria as any)?.label` —
the one spelling the shared ARIA shape REFUSES — so it discarded the spec-valid
`ariaLabel` and honoured only a spelling no author can write without the
contract rejecting the document. Zero of the six declared slots was live. That
is the dead-read-point pair objectui#4663 repaired on `record:quick_actions`,
still open on the rest of the family, and it lands on screen-reader users: the
author wrote an accessible name, got a success receipt, and nobody heard it.

Under the maintainer's standing principle — spec declaration over
implementation over docs — an accepted-then-dropped key is an implementation
gap, so the six renderers gain the read. ⛔ Nothing is narrowed on the consumer
side, and ⛔ no declaration is retired here.

## The two declaration changes

- **`@object-ui/types` — `RecordComponentAriaProps.ariaLabel` is now
  `string | I18nLabel`.** `AriaPropsSchema.ariaLabel` is
  `z.union([z.string(), InlineLocaleMapSchema])`, so the bare `string` was a
  narrowing: a map-valued name like `{ en: 'Deal stages', 'zh-CN': '阶段' }`
  parsed at publish and `tsc` refused it here. This is a fourth site of
  objectui#9092's Group A, missed there because it is reached through a shared
  interface rather than restated inline. **For a `.d.ts` consumer:** writing
  `aria.ariaLabel` gains the map arm and no existing write breaks; a consumer
  that *reads* the member into a `string` position now sees
  `string | I18nLabel | undefined` and is named by the compiler — which is the
  audit the widening exists to produce, and is why this is `minor` rather than
  `patch`. Every in-repo reader of the six interfaces lives in
  `@object-ui/plugin-detail`, and both packages type-check clean.
- **`@object-ui/plugin-detail` — no new published symbol.** The shared read
  point (`renderers/recordComponentAria.ts`) is internal; it is not added to the
  package barrel, so `dist/index.d.ts` gains nothing. What changes is
  behaviour. `record:quick_actions`' own props interface keeps its `aria`
  member and is retyped from an inline `{ ariaLabel?, label? }` to the family's
  bag, which widens `ariaLabel` there the same way.

## Behaviour, stated exactly

A block that is authored with no `aria` keeps **the same attributes with the
same values** it has today: the five containers stay bare `div`s and gain
nothing at all, `record:path`'s rails keep `role="list"` and their localized
pack name, and `record:quick_actions` keeps `role="toolbar"` and its built-in
"Quick actions". Every current default is passed to the shared read point as
that block's `defaultRole` / `defaultLabel` rather than removed. (Stated as the
attribute set and not as the bytes: on the two blocks that already emitted ARIA,
the same pair now arrives through a spread, so their serialization ORDER can
differ while the accessibility tree does not.)

When an author *does* declare the bag, the container gains `aria-label`,
`aria-describedby` and a role — **a role, and not only the attribute, because
`aria-label` on a bare `div` reaches nobody**: a `div` is `generic` and browsers
expose no accessible name on it. This family has already paid for that once, in
`record:path`'s inert `aria-label="Alternative terminal stages"`. So the five
containers fall back to `role="region"` when named, matching
`@object-ui/plugin-list`'s live read point
(`role={schema.aria?.role ?? 'region'}`), and an authored `aria.role` overrides
every default. The new pin asserts through `getByRole(role, { name })` rather
than through the attribute, so a fix a screen reader cannot hear would fail it.

⚠️ **On `record:activity` and `record:chatter` the authored name does not
replace the panel's own.** Those blocks mount a panel that already renders a
named `<section>`, so an authored name lands on the block's outer container and
the panel keeps its inner one — two nested named regions. That is measured and
pinned as the shipped behaviour, ⛔ not as the right answer; objectui#9556 asks
whether the authored name should replace the panel's, and that would have to be
plumbed into `RecordActivityTimeline` / `RecordChatterPanel`.

## What is deliberately NOT done

- **The legacy `aria.label` alias is neither introduced nor retired.** It stays
  a fold behind the canonical spelling, exactly where objectui#4663 and
  `normalizeListViewSchema`'s `ARIA_KEY_ALIASES` already put it, and it remains
  declared on no authoring face. The contract refuses it, so it cannot mask a
  new authoring mistake; whether it should be removed outright is left open on
  objectui#9556 rather than settled in passing.
- **No `aria` declaration is added for `record:quick_actions`.** The protocol
  declares none on `RecordQuickActionsProps` and refuses the bag there with a
  message naming objectui's renderer as the thing that moves first; mirroring it
  onto a published `@object-ui/types` face would declare a key the contract
  rejects.

⛔ No count, list or population in the text above is written down as a fact to be
trusted: which blocks the contract declares `aria` on, which spellings the shared
shape accepts, and whether `record:quick_actions` still refuses the bag are all
re-derived from the installed `@objectstack/spec` artifact on every run by
`renderers/__tests__/recordComponentAria-9556.test.tsx`, which goes red the day
the protocol moves either boundary.
