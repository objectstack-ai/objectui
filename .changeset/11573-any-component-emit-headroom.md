---
'@object-ui/types': patch
---

fix(types): `AnyComponentSchema`'s declaration prints every category union by name, so `@object-ui/types` no longer sits at the edge of TypeScript's serialization ceiling (objectui#11573)

`tsc` prints an inferred type in full wherever a declaration uses it, and past
its serialization ceiling it refuses with TS7056 ("The inferred type of this
node exceeds the maximum length the compiler will serialize"). `@object-ui/types`
then emits no declarations, and every consumer of `@object-ui/types/zod` fails
with TS7016. `AnyComponentSchema` listed every category union inline, so its
declaration printed the sum of all of them: measured with TypeScript's own
counter, it read under one percent short of the ceiling against
`@objectstack/spec` built from objectstack `main`, and the Spec Main Shape Gate
had already gone red on it once.

Each of the sixteen category unions `AnyComponentSchema` lists now has a named
type in its own module — an interface that extends the union's inferred type
and adds no member (`LayoutZodType`, `PublicBlockComponentZodType` and their
siblings) — and `AnyComponentSchema`'s declaration prints a reference to each
instead of its body.

What changes for a consumer is the printed `.d.ts` TEXT of existing exports,
and nothing else: `AnyComponentSchema` and the sixteen unions are the same
values, and every type read through `z.input` / `z.output` is unchanged. The
new names are exported from their own modules, which is what lets the
declaration reference them; they are not added to the `@object-ui/types/zod`
entry, so nothing new is importable.

`packages/types/src/__tests__/any-component-emit-headroom-11573.test.ts` reads
the declaration's size with the compiler's own counter, fails when it crosses a
tenth of the ceiling below it, and lists every member as named or inline.
