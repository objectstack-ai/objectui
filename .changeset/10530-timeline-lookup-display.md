---
'@object-ui/plugin-timeline': patch
---

A timeline no longer crashes when its `titleField` or `descriptionField` names a lookup.

`ObjectTimeline` copied the raw `titleField` and `descriptionField` values onto each
item, and the renderer puts both in JSX. A lookup is a field like any other, and
`ObjectTimeline`'s own object fetch expands every declared relation, so a
lookup-typed title or description arrived as `{ id, name }`. React then threw
`Objects are not valid as a React child` as soon as the rows landed, and the whole
timeline failed to render.

The item mapping now derives the title and the description once, as display
strings, through `@object-ui/core`'s `recordDisplayValueAt`, the resolver
`ObjectMap` uses for the same two slots:

- an expanded lookup shows its display name;
- a plain string, a number or a bare id shows as before;
- a boolean shows as its string, where the old truthiness gate dropped `false` and
  drew an empty line for `true`;
- a `0` shows inside its title or description line, where it used to be painted as
  a bare character beside it;
- an empty or whitespace-only value, or an expanded record with no display name,
  shows no line, and surrounding whitespace is trimmed.

No schema or spec key changes. `ObjectTimeline.lookupDisplay-10530.test.tsx` pins
each case above.
