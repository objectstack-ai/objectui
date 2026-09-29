---
'@object-ui/core': patch
'@object-ui/app-shell': patch
---

Citations of objectstack cards now name their repository (objectui#11016).

A bare `#N` in this repository resolves to an objectui item. Where the sentence
meant an objectstack card, a reader who followed the number landed on an
unrelated objectui card or pull request, and nothing flagged it: both
repositories answer for the number, so an earlier sweep that looked for dead
numbers could not see this class.

Two of those citations are runtime text, and they now name the card they mean:

- `@object-ui/core`: the dev warning for an action that still carries the
  retired `execute` key (`RETIRED_ACTION_KEYS.execute`) points at
  objectstack-ai/objectstack#3855, the card that retired the alias. The rest of
  the message, including "rename the key to `target`", is unchanged.
- `@object-ui/app-shell`: the Studio skill form's help text for
  `triggerConditions` points at objectstack-ai/objectstack#1878 and
  objectstack-ai/objectstack#1895.

The other sites are code comments and doc comments in the non-test sources,
requalified the same way: a bare number whose sentence meant
an objectstack card now reads `objectstack-ai/objectstack#N`. Numbers that mean
an objectui card stay bare. Where a comment quotes objectstack's own text, the
quote keeps its words and the card name sits in square brackets, the editorial
mark for a substituted word.

Pending entries in this release that carry such a number get a dated note
naming the card, and their frontmatter is unchanged.

Nothing else moves: no key, accept set, refusal decision or code path.
