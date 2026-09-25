---
'@object-ui/plugin-map': patch
---

A map marker's description no longer crashes the popup when `descriptionField` names a lookup.

`ObjectMap` copied the raw `descriptionField` value onto each marker. The popup and
the mobile record sheet put that value in JSX, and the search box called
`.toLowerCase()` on it. A lookup is a field like any other, and `ObjectMap`'s own
object fetch expands every declared relation, so a lookup-typed description arrived
as `{ id, name }`. React then threw `Objects are not valid as a React child` on the
first marker click. A number or a boolean description made the search box throw as
soon as anyone typed.

The marker transform now derives the description once, as a display string, through
`@object-ui/core`'s `recordDisplayValueAt`. That is the resolver the marker title
already uses for an authored `titleField`. The popup, the mobile record sheet and
the search all read that one string:

- an expanded lookup shows its display name;
- a bare id shows as itself, as before;
- a number or a boolean shows as its string, so `false` now appears where the old
  truthiness gate dropped it;
- an empty or whitespace-only value, or an expanded record with no display name,
  shows no description line.

No schema or spec key changes. `ObjectMap.descriptionDisplay-10456.test.tsx` pins
each case above.
