---
'@object-ui/cli': minor
---

`objectui validate` and `objectui check` judge a document through the strict authoring face (objectui#5250)

Both commands parsed an authored document with `safeValidateSchema`, whose node schemas are
`.passthrough()`: a key no schema declares was kept and never judged, so a misspelled or invented
key read `✓ Schema is valid!`. They now parse through `StrictAnyComponentSchema`, the strict twin
of the same declarations (objectui#8345), under the objectui#5250 ruling: the authoring verdict is
strict, while the rendering face keeps its passthrough.

**Breaking for documents that carry an undeclared key.** `objectui validate` now exits 1 on such a
document, on the root node and on every nested node, and names each key, the path of the object
carrying it, and the fix:

    Undeclared key "validation" at (root) (type "input"): no schema declares it there. Remove it, or check its spelling against the keys declared at that position.

A nested child's key is named at the child's path, and so is one inside a union the node fits
more than one arm of (a dashboard widget), where the issue list reports only an `Invalid input`
that names no key. For an undeclared key `objectui check` stays advisory — it does not change the
exit code, which is non-zero on unreadable JSON and on a `${…}` refused on a text key its node never
evaluates (objectui#4795) — but such a file is no longer counted as validated: it is listed by name
among the files that did not validate, with the same line under it. Its `${…}` expressions are still
judged, so a listed file can fail the run for an expression. There is no flag to opt out.

Where another entry in this release says `objectui validate` or `objectui check` runs
`safeValidateSchema`, the tolerant face, this entry supersedes it: both commands run the strict face.

Declared `minor` rather than `major` because this release group follows the `@objectstack` major;
the breaking semantics are stated here instead.
