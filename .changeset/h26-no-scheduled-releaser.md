---
---

Internal only — `scripts/pm/check-half-states.mjs` is a PM sweeper under `scripts/`, not
published source of any released package. `node scripts/check-changeset-presence.mjs` reports
nothing owed for this range; this empty-frontmatter changeset is the explicit "no release"
declaration rather than a silent absence.

H26's assertion half is retired: the row no longer claims `pm:on-hold` / `needs-user-decision`
are states a card can never close out of. It now reports what is measurable — the wait has no
SCHEDULED releaser. See objectui#9317.
