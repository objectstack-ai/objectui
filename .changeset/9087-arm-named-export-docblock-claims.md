---
---

Correct six docblock claims in `packages/types/src/__tests__/arm-named-export-8784.test.ts`
and add the control one of them described but no test carried (objectui#9087).

No published package source changes: one test file plus this declaration. The pin's
mechanism, its firing legs and its census are untouched — every edit is a comment, and
the one code change is an ADDED `it`.

**The item that earns the change.** An ablation that weakens `namesOn` from identity to
"identity OR the arm's declaring name" left the whole file green — with the barrel intact
AND with `export { NavigationSchema as BreadcrumbSchema }` written to `index.zod.ts`. The
existing permanent control states that property on probe schemas, and a probe schema has
no declaring name for such a check to match on, so nothing in the file could see the
difference; only a one-off on-disk run could. The added control reads the real barrel with
the arm's name rebound to its parent union, and reddens under exactly that weakening.

The other five were prose: a zod claim measured false on the installed zod, a
`z.discriminatedUnion` rationale wrong on mechanism and misattributed to another test, an
unsupported "was prepared", a cross-reference to an `it()` title no test carried, and an
overstatement about where a deleted changeset's reason goes. A hard-coded control count in
the same block ("all four", carrying five) is removed rather than corrected, which is the
shape AGENTS.md #9 asks for.
