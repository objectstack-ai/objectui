---
---

Pay down the three `UNGATED_DOCS` rows objectui#7308 opened for the nested
package READMEs, so `scripts/check-doc-snippet-types.mjs` compiles all three
pages instead of declaring them unverified.

The one reader-visible defect is on `packages/core/src/adapters/README.md`: the
custom-adapter template declared `implements DataSource<T>` while omitting
`getObjectSchema`, which the interface requires, and wrote `// Your
implementation` as the whole body of six methods annotated non-`void`. A reader
who copied it got a class that does not satisfy the interface it claims. The
template now carries all six required members and throws from each
unimplemented body, so it type-checks at every step of being filled in.

`packages/types/src/zod/README.md` had two `{ ... }` elisions TypeScript reads
as a spread with no operand, six excerpts continuing an earlier block's imports,
one fence holding a before-and-after pair that declared the same two names
twice, and a shape sketch fenced as TypeScript. `packages/components/src/__tests__/README.md`
gains the imports a file in that directory really writes, and a fragment
declaration saying why a probe compiled at the repository root cannot resolve
either of them.

No published file changes: none of the three pages is inside any package
tarball — each package's manifest `files` list carries `dist` and the
package-root `README.md`, and `npm pack --dry-run` reports zero entries under
`src/` for all three. Gate script and its own test suite only, otherwise.
