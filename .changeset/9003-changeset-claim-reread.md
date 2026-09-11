---
---

Tooling only, no published surface: a report-only gate that re-reads pending
changesets when a later change touches a file their prose names (objectui#9003).

A `.changeset/*.md` body publishes verbatim into the CHANGELOG at the next
release, and between authoring and release nothing re-reads it. The new gate asks
one mechanical question — does a pending body name, in backticks, a file this
change touches — and hands the paragraph to the seat whose diff might have
falsified it. It judges name resolution, never truth; it covers claims that WENT
false and not ones BORN false; and it never blocks.
