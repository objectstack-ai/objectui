---
---

Test-only change (objectui#8071 slice 7): converts the last four one-key
`MEMBER_PIN_EXEMPTIONS` blocks — `element:button.action`,
`element:number.filter`, `page:accordion.items` and `page:tabs.items` — into
real per-block member pins, deletes those four exemptions and lowers
`MEMBER_PIN_EXEMPTION_CEILING` 41 -> 37 in the same commit. Adds four member-shape
test files under `packages/components`; no published behaviour changes.
