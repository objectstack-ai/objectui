---
'@object-ui/plugin-kanban': patch
---

Fix the Kanban bucketer throwing (and mis-bucketing) when a record's `groupBy` value
is a member name of `Object.prototype` (objectui#9043).

`bucketCardsIntoColumns` built its label-to-lane map and its grouping accumulator as
prototype-bearing object literals and then keyed both from **record data**, which no
schema guards — `@objectstack/spec` narrows the lane `id` (objectui#8913), not the
values stored in the grouped field. A stored value of `'toString'`, `'valueOf'` or
`'hasOwnProperty'` therefore hit the inherited METHOD in the accumulator: it is truthy,
so the array was never created and `.push` was called on a function, thrown during
render — the user saw a blank board or an error boundary with nothing naming the
offending record. `'constructor'` and `'__proto__'` took the other branch (they survive
the `.toLowerCase()` on the label-map read) and were grouped under the stringified
inherited member instead of their own value. A lane legitimately declared with one of
these option values was worse still: writing `labelToColumnId['__proto__']` invoked the
`__proto__` setter and was silently ignored, and the injection read `groups[col.id]`
answered `Object.prototype`, which spreads as "not iterable".

Both maps are now created with `Object.create(null)`, so every key is answered by what
the function stored. A `hasOwnProperty` guard was not used: it closes the reads only,
and the `'__proto__'` hazard is on the writes.

Records that match no lane keep today's behaviour — they surface in the trailing
"Uncategorized" lane (objectui#2792), never discarded. Bucketing for ordinary values is
unchanged.
