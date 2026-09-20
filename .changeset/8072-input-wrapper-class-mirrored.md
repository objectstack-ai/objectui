---
'@object-ui/types': patch
---

Mirror `wrapperClass` on `InputSchema` (objectui#8072 — the last
`schema.wrapperClass` reader whose value the validator admitted unexamined).

`packages/components/src/renderers/form/input.tsx` reads
`cn("grid w-full items-center gap-1.5", schema.wrapperClass)` onto the wrapper
`div` around the input and its label. The TypeScript face has declared the key
all along (`form.ts`, docblock "Input wrapper CSS class"); the zod mirror never
did, so the value rode through `.passthrough()` and
`{ type: 'input', wrapperClass: 42 }` validated GREEN — while the identical
document on any of the other eight `schema.wrapperClass` readers (`checkbox`,
`file-upload`, `filter-builder` — objectui#6150 / #6938; `switch`, `textarea`,
`date-picker`, `select`, `list` — objectui#7722) was refused at the key.

**patch, and one step below objectui#6938's patch on the surface dimension.**
objectui#7722 graded its batch `minor` because five schemas each gained a member
of the shipped `.d.ts`. Nothing of the sort happens here: the published
TypeScript face does not move by one byte — the key was already on it — and only
the zod mirror gains the member it was always supposed to restate. Two verdicts
move, in opposite directions:

- **A non-string `wrapperClass` on `input` is now REFUSED at the key.**
  `{ type: 'input', wrapperClass: 42 }` parsed green before, on the mirror and
  through `safeValidateSchema`; it is refused now, at `wrapperClass`. That is
  enforcement of the type the TypeScript face already published, not a new
  capability — but it is a behaviour change for a document that carried a
  wrong-typed value there, a value the renderer would have interpolated into the
  class string as text.
- **The derived strict authoring face stops refusing the key.**
  `StrictAnyComponentSchema` (objectui#8345) is derived from these mirrors and
  closes unknown keys, so an authored *string* `wrapperClass` on `input` — the
  spelling the published TypeScript declaration invites — was refused there
  outright. It parses now. The two faces move apart: the tolerant one narrows,
  the strict one stops contradicting the TS declaration.

Nothing well-typed stops validating: an authored string `wrapperClass` on
`input` parsed green before and parses green now, with the value surviving the
parse, and an undeclared key of any type is still admitted unexamined on this
mirror (pinned with a control key the renderer does not read). The
`InputShorthandSchema` arm stops re-declaring the key locally and inherits it
from `InputSchema` like every other key, with its membership and its refusal
pinned so the inheritance is measured rather than assumed.

The gap was a recorded row of the parity ledger
(`UnmirroredDeclared['form.zod.ts#InputSchema']`), so closing it moves that
file's census figures — the entry's only key, so entry count and key total move
together — and expires the self-expiring exemption objectui#7722's sweep carried
for this one reader, which is deleted rather than weakened.
