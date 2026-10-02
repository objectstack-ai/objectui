---
'@object-ui/components': minor
'@object-ui/types': minor
---

`input-otp` draws the separator its docs page teaches (objectui#11365). The "With Separator" example on the `input-otp` docs page and two catalog entries (`with-visual-separator`, and the `input-otp` inside `verification-form`) author `separator: true`, but no type declared the key and the renderer read nothing for it, so they drew no separator at all. Triage ruled the enforce arm of ADR-0049: the shipped primitive already exports `InputOTPSeparator`, so the key is declared and drawn, and the docs page and catalog entries stay as they are.

**Components.** With `separator: true`, the `input-otp` renderer splits its `length` slots into two groups at the midpoint and draws one `InputOTPSeparator` (`role="separator"`) between them, the shadcn "with separator" layout. An odd `length` puts the extra slot in the first group (5 slots draw as 3 and 2). One slot has nothing to separate and draws no separator. Without `separator`, or with `separator: false`, the markup is unchanged: one group holding every slot. The `input-otp` registration publishes `separator` as a boolean input.

**Types.** `InputOTPSchema` gains `separator?: boolean` on both faces. The TypeScript face now refuses a non-boolean `separator`; before, `BaseSchema`'s index signature admitted any value. The zod mirror refuses a non-boolean `separator` with `invalid_type` at the key; before, `.passthrough()` kept it unjudged. The strict authoring face now accepts `separator`, where it used to report it as an unrecognized key. The "What it renders instead" list in the node's `body` / `children` refusal messages now names `separator`.

**minor, not patch — the published face gains a member.** `separator` is a new member of the shipped `.d.ts` and of the mirror's `.shape`, and the mirror refuses a non-boolean value by name.
