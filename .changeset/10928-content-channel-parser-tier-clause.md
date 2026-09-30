---
'@object-ui/types': patch
---

Correct a false clause in the content-channel refusal messages (objectui#10928).

The family-D / E3 refusals on the nodes whose renderer reads neither content channel (objectui#9256) explain why `body` and `children` are refused by name: an authored value rendered nothing. They went on to say it drew "no error, no warning, no element". The render path is as described, but the parser tier is not: `validateTree` warns `not-a-container` for a child list under a registration that declares no `children` input (objectui#9910), and it answers a `body` child list with the same code. So each of these refusals now says "no render-time error or warning and no element; only the parser tier's `not-a-container` warning (objectui#9910) noticed it".

The change reaches the zod mirror's refusal messages and their `.describe()` text (on both members, whether the string is a literal or is built by `neitherContentChannelGuidance`), and the matching `body?: never` / `children?: never` docblocks in the emitted `.d.ts`. Every other word of each message is unchanged.

Message and documentation text only: every document is accepted or refused exactly as before, with the same issue code at the same path.
