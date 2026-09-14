---
'@object-ui/i18n': minor
---

Retire 23 measured-dead locale keys from all ten packs — two whole families and
eleven individual leaves (objectui#8754; director seat summon #22, 2026-09-12,
maintainer verbatim 「其他同意」).

**Breaking, deliberately.** These keys no longer exist in any of the ten built-in
packs. This repository has no reader for any of them, but `@object-ui/i18n` is a
published package: an application outside this repository that calls `t()` with
one of the keys below now renders the raw key name instead of a sentence, with no
error thrown (i18next's missing-key fallback). That risk is accepted rather than
overlooked — the standing maintainer ruling is immediate retirement with no staged
window and no double-spelling grace, on the grounds that 「已发布零消费的能力不因
沉没成本获得豁免」.

Marked `minor` rather than `major` because this repository's fixed release group
tracks `@objectstack`'s major line; the breaking semantics are stated here instead.

**Migration.** If you call one of these keys, supply the string yourself — pass
`defaultValue` to your `t()` call, or add the key to your own application's
resource bundle. For the two families there is a better answer than re-adding the
key, because a live surface already exists and the retired family was never wired
to it:

- `approvals.*` — the shipping approvals UI renders through **`approvalsInbox.*`**,
  a different namespace that is fully populated in all ten packs. Point at that.
- `marketplace.pricing.*` — nothing renders pricing labels in this repo at all.
  There is no replacement key; author your own.

**The two families, retired whole** (the unit of this retirement is the family:
retiring half a dead family leaves the other half looking live by contrast, and
the namespace roots are removed, not merely emptied):

- `approvals.approve`, `approvals.approveSuccess`, `approvals.comment`,
  `approvals.reject`, `approvals.rejectConfirm`, `approvals.rejectSuccess`
- `marketplace.pricing.contact-sales`, `marketplace.pricing.free`,
  `marketplace.pricing.freemium`, `marketplace.pricing.paid`,
  `marketplace.pricing.subscription`, `marketplace.pricing.usage-based`

**The eleven individual leaves.** Each was held out of an earlier sweep by a
LONGER live sibling that merely contained it, until PR objectui#8753 put a
key-boundary requirement on the text probe. The sibling that actually renders is
named beside each, and every one of them is unaffected by this change:

- `appDesigner.noNavItems` — renders as `appDesigner.noNavItemsHint`
- `appDesigner.separator` — renders as `appDesigner.separatorLabel`
- `console.objectView.groupBy` — renders as `console.objectView.groupByField`
- `console.objectView.toolbar` — the live sibling is `…toolbarEnabledCount`
- `dashboard.removeWidget` — the live string is the designer table's own
  `engine.inspector.dashboard.removeWidget`, a different corpus
- `form.addItem` — likewise the designer table's `engine.form.addItem`
- `home.recent` — renders as `home.recentApps.title`
- `home.starred` — renders as `home.starredApps.title`
- `home.subtitle` — the live sibling is `home.build.subtitle`
- `sidebar.help` — renders as `sidebar.helpTooltip`
- `workspace.create` — renders as `workspace.createTitle` / `…createButton`

**How the set was admitted.** Not from the card's body: `pnpm check:i18n-dead-keys`
was re-run on this change's own base after the objectui#9222 instrument repair,
and every key above is CONFIRMED by that run, or is NEEDS-REVIEW whose only hit is
non-liveness (a changelog line; a pin test). The retirement is pinned negatively by
`packages/i18n/src/__tests__/dead-pack-keys-retired-8754.test.ts`, because every
other i18n gate in this repo runs call site → key and none of them can see a key
coming back.
