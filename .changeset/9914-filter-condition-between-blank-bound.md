---
'@object-ui/fields': minor
---

Stop `FilterConditionField` writing a `between` row into stored criteria until BOTH bounds
are filled in (objectui#9914).

`condToMongo`'s `between` arm handed whatever was in the two boxes straight to
`coerceByType`, which returns `''` unchanged (its `value !== ''` conjunct). So a range the
admin had half typed travelled through `handleBuilderChange` → `filterGroupToMongo` →
`onChange(JSON.stringify(mongo))` into a stored `sys_sharing_rule.criteria_json`. The
existing operator pin exercises `between` with a COMPLETE pair only, so the half-filled
case had never been driven.

Measured against `ValueDataSource`'s matcher over four rows, the three documents this
could author are three different predicates and not one of them is the range being typed:

- `{ age: { $gte: 1, $lte: '' } }` matched **0 of 4** rows — `1 <= ''` is `1 <= 0` — so a
  sharing rule saved mid-edit silently shares nothing;
- `{ age: { $gte: '', $lte: 5 } }` matched **3 of 4**, including a row the real lower
  bound would have excluded, because `''` compares as `0`;
- `{ age: {} }` matched **all 4**. That is what an untouched `between` row emitted the
  moment the operator was picked: the builder clears both bounds to `[]` and
  `JSON.stringify` drops the two `undefined`s. On a sharing rule that is an over-share,
  and the widget's own `isMatchAllCriteria` hint does not catch it — a field key holding a
  nested object is not one of the vacuous shapes it recognises.

That last shape also fails `kvToCondition`, so the widget read its own emission back as
unrepresentable and forced ITSELF into the raw-JSON editor with the toggle disabled.
Picking **Between** therefore ended visual editing of the rule — objectui#8748's shape, on
a second operator. It is fixed by the same change.

**What changes.** A `between` condition whose lower or upper bound is `undefined` / `null`
/ `''` now emits no fragment at all, exactly as an unfinished text row already did. A
complete range emits precisely what it emitted before, and `0` and `false` stay real
bounds — the drop is spelled `===` against the three unfilled shapes, never `!bound`. A
rule whose only row is a half-filled range therefore saves as empty criteria and is
refused on save (objectstack#3896) instead of storing a predicate nobody typed. Criteria
already stored are untouched: they still load, and they still emit what they carry once
both bounds are on screen.

**Why the row is dropped rather than narrowed to the one bound that IS filled.** That
question is already ruled in this tree: `isFilterValueComplete` states that a range
missing an end "is not a narrower range, it is a query the server refuses", and both the
view fold and the view-override recovery pass drop such a row rather than narrow it.
Emitting a one-sided `$gte` here would author a filter the admin never typed, into a rule
that decides who sees what.

**The widget keeps its own completeness rule**, deliberately diverging from
`isFilterValueComplete` as its comment declares: `equals ''` is a real predicate here and
goes on being emitted, and this drop takes no dependency on a helper marked `@internal` in
another package. What the divergence protects is the EMITTED DOCUMENT, not the dropdown's
notion of a finished row — which is why the new drop fits inside it rather than replacing
it.
