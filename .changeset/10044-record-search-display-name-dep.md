---
'@object-ui/react': patch
---

`useRecordSearch` no longer keys its search effect on the identity of the
caller-supplied `getDisplayName` option (objectui#10044).

The resolver is read only inside a run, to label hits; it never decides whether a
run happens. It was nevertheless the last entry of the search effect's dependency
list, and that effect's cleanup clears the pending debounce timer. A caller passing
the obvious spelling for an optional callback, an inline arrow, handed the hook a new
function on every render, with two opposite results: a parent re-rendering faster
than `debounceMs` (250 ms by default) never searched at all, and a parent re-rendering
sparsely issued a second, identical request after the first had gone out. This is
the dependency AGENTS.md §5 commandment #10 bans.

Each run now reads the resolver of the latest render through a ref, so an inline
resolver is safe. A swapped resolver labels the hits of the next run; results already
shown keep their labels. The option's name, type and default are unchanged.
