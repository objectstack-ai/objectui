---
'@object-ui/app-shell': patch
---

`ConditionBuilder` takes an optional `scope`, and three metadata-admin mounts now
declare `record` (objectui#8167).

**The defect.** The builder's raw CEL editor had no `scope` prop at all, so every
mount fell through to `celAuthoring`'s own default — spelled `hint.scope ?? 'flattened'`
— and no caller could override it. A bare `status == 'done'` typed into an action's
**Visible when** therefore linted CLEAN and then never matched: `usePredicateRecordContext`
binds `record` and nothing else, and objectui#5741 Phase 2 retired the bare shorthand
on runtime record surfaces. This is objectui#7727's defect at a component
objectui#7727 does not touch; PR #8164 turned the same defect at the
conditional-formatting mount.

**What changed.**

- `scope?: 'record' | 'flattened'` is now an optional prop, forwarded verbatim to
  `CelPredicateField`. Omitting it forwards `undefined`, so the engine hint is exactly
  what it was and every mount that passes nothing is unchanged. It deliberately does
  **not** derive the scope from `subjects.fieldPrefix` — that would silently decide the
  mounts whose tier is still an open question.
- An action's **Visible when** and **Disabled when** (`ActionDefaultInspector`) declare
  `scope="record"`. Conformance: the row-predicate canon in `@object-ui/core`
  (`rowPredicateCanon.ts`) names `visible` / `disabled` on an action renderer as a row
  surface in its own words.
- An object validation rule's `condition` (`ObjectValidationsPanel`) declares
  `scope="record"`. The authority there is the server: objectql's rule validator
  evaluates a `script` / `cross_field` condition with `{ record, previous }` and nothing
  else, and since objectstack#4649 an unevaluable predicate is fail-CLOSED — so a bare
  reference authored here did not merely fail to match, it rejected every write to the
  object while the editor linted it green.

**Author-visible effect.** At those three editors a bare field reference is now a
blocking lint error naming the `record.<field>` rewrite, instead of a silent pass. The
row builder at those mounts was already emitting `record.<field>`; this makes the raw
expression editor agree with the rows its own sibling mode produces.

**Deliberately unchanged.** The page-block `visibleWhen`, hook `condition` and
schema-driven `ConditionWidget` mounts still pass nothing and still lint flattened.
Their tier is a real open question on objectui#8167 and an explicit value would be a
claim about it. The flow-node condition stays as-is — flow tier is not a row surface.
