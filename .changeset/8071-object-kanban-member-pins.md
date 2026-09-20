---
---

Tests only — objectui#8071 slice 16. Converts the last two `object-kanban`
entries in `apps/console/src/__tests__/registry-inputs-spec-parity.test.ts`'s
`MEMBER_PIN_EXEMPTIONS` into registered per-block member pins, deletes the two
exemptions and lowers `MEMBER_PIN_EXEMPTION_CEILING` in the same change. The
block is now fully pinned, and `NEWLY_JUDGED_UNPINNED_MEMBERS` — the named
audit of the one ceiling RAISE this file has had (objectui#8176) — is empty:
every declaration that correction admitted is judged by a pin rather than by
headroom.

`columns` gets a new renderer-side pin in `@object-ui/plugin-kanban`
(`objectKanbanColumnMembers-8071.test.tsx`), which is deliberately a second
file rather than a promotion of objectui#8913's declaration pin: every
assertion there is a `safeParse`, and objectui#8068's criterion for a member
pin is the shape the renderer READS. `dataSource` promotes the pre-existing
`ObjectKanban.elementDataSource.test.tsx` and grows it by the binding member
dispositions it never stated — including the one that is INERT on this block.

No published executable source moves: both pin files and the ledger are test
files, so this changeset is the explicit "no release" declaration
`scripts/check-changeset-presence.mjs` accepts, not an omission.
