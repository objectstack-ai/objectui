---
---

Tests only — no published behaviour changes.

objectui#8071 slice 17 converts the four remaining `object-grid` member-pin
exemptions (`columns`, `filter`, `grouping`, `sort`) into named per-block member
pins and lowers `MEMBER_PIN_EXEMPTION_CEILING` in the same change, which closes
the block. Two of the four pins are pre-existing test files promoted after being
read end to end and grown by the member dispositions they never stated; two are
new test files. Nothing under any package's published `files[]` moves.
