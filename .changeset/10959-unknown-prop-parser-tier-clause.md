---
'@object-ui/types': patch
---

Correct a false clause in the `header-bar` refusal messages and in nine `body?: never` docblocks (objectui#10959).

The `HeaderBarSchema` refusals for `title`, `logo`, `nav`, `left`, `center`, `right`, `sticky`, `height` (objectui#10387) and `variant` (objectui#10286) said an authored value drew "no error, no warning". So did the `body?: never` docblocks on `box`, `span`, `container`, `flex`, `stack`, `grid`, `scroll-area`, `toggle` and `form` (objectui#8284), which ship in the emitted `.d.ts`. The render path is as described, but the parser tier is not: `validateTree` answers each of those keys with an `unknown-prop` warning. So the refusals now say "no render-time error or warning and no element; only the parser tier's `unknown-prop` warning noticed it" (`variant` keeps "no class" where the others say "no element"), and the docblocks say the `body` "rendered an EMPTY element with no render-time error or warning; only the parser tier's `unknown-prop` warning noticed it".

Message, `.describe()` and documentation text only: every document is accepted or refused exactly as before, with the same issue code at the same path. Every other word of each message and docblock is unchanged.
