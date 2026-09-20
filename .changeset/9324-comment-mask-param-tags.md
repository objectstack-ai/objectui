---
---

Tooling only, no runtime change and no behaviour change: the three parameter-taking
exports of `scripts/js-comment-mask.mjs` that carried no `@param` tag now carry one
(objectui#9324).

`tsconfig.scripts.json` compiles `scripts/**` with `allowJs: true` and `checkJs: false`
deliberately (objectui#3494), so a `.ts` consumer's types for these helpers come from
inference over the `.mjs` source, steered by JSDoc and by nothing else. Four exports take
parameters; only `scanSource` documented them. `blank` had a one-line prose docblock,
`stripComments` and `maskComments` had prose-only multi-line ones — so their parameters
inferred `any` and every consumer call site was accepted unchecked. Measured on the same
tree: `maskComments(12345)` — a number passed to a string parameter — type-checked clean
at exit 0.

`scanSource` was the control that proved this was the missing tag rather than `allowJs`
failing to type anything: it is imported alongside `maskComments` in the same files,
under the same config, and it was checked. It is left exactly as it was.

The masker's OUTPUT is untouched, which matters because several gates in this repo read
it as the single authority on "is this span a comment, or code?" and objectui#9183 routed
29 test files onto it for that reason. All four exports were run over a nine-file corpus
of real repo sources (299,880 characters, 141,075 of them flagged as comment) before and
after the change, and every digest is identical.

`js-comment-mask-param-types-9324.test.ts` is what keeps this from being decorative. It
compiles real calls against the real module with the real project options and asserts the
DIAGNOSTIC rather than the tag's spelling: a wrong-typed argument must produce TS2345 and
a correctly-typed one must produce nothing. Deleting a `@param` again makes the
wrong-typed half stop erroring — the direction a grep for the tag cannot see. The
correctly-typed half is there so that a signature narrowed until every real call fails
cannot pass either.
