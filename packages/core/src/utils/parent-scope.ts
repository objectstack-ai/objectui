/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * The parent-relationship condition a detail-page related list is scoped by —
 * compiled ONCE, here, for every surface that asks the question.
 *
 * ## Why this is a seam and not a helper
 *
 * A related list asks its backend "which children belong to this parent?" from
 * two places: the ROW query (`RelatedList`) and the tab-badge count probe
 * (`RelatedCountStore`). Those two used to compile the condition separately,
 * and objectui#8882 is what that costs: objectui#7299 taught the ROW side to
 * compile by the relationship field's ARITY, the BADGE side kept sending bare
 * equality, and on a multi-value relationship the page then rendered rows above
 * a tab with no count at all — two implementations of one question, drifted.
 *
 * Patching the second copy to match the first would leave two copies. So the
 * condition has one implementation, and both callers import it.
 *
 * ## The rule itself is not invented here
 *
 * The arity verdict is `@objectstack/spec/data`'s own `isMultiValueField`, the
 * same predicate the driver that executes the query decides on. That matters
 * more here than anywhere: this function chooses `$contains` vs `=`, the driver
 * chooses whether to accept it, and two readers of one question disagreeing is
 * the entire defect class. The spec's rule is BROADER than an eyeballed
 * `multiple === true` in both directions — `multiselect` / `checkboxes` /
 * `tags` persist an array with no flag at all, and `multiple: true` is INERT on
 * a type outside the spec's multi-capable set (`master_detail`, say) — so a
 * local approximation is wrong in both directions, not merely incomplete.
 *
 * ⛔ Do not add a local arity rule at any call site, however small, and ⛔ do
 * not widen this function to accept an arity the caller computed: the parameter
 * it takes is METADATA, and the verdict is drawn from it here.
 */

import { isMultiValueField, type ValueShapeFieldDef } from '@objectstack/spec/data';
import type { FieldContainerLike } from './predicate-record.js';

/**
 * Look one field def up in either container shape the metadata API serves.
 *
 * The pair is the one {@link FieldContainerLike} names: the Record keyed by
 * field name, and the array of defs carrying their own `name`. A reader that
 * knows only one of them silently answers "no such field" for the other — and
 * "no such field" here means "single-valued", which is this card's own bug
 * spelled as a default.
 */
export function parentRelationshipFieldDef(
  fields: FieldContainerLike,
  fieldName: string | undefined,
): ValueShapeFieldDef | undefined {
  if (!fieldName || !fields || typeof fields !== 'object') return undefined;
  const def = Array.isArray(fields)
    ? fields.find((f) => (f as { name?: unknown } | null)?.name === fieldName)
    : (fields as Record<string, unknown>)[fieldName];
  if (!def || typeof def !== 'object') return undefined;
  // `type` is the one member the spec's predicate reads besides `multiple`; a
  // def without it answers `false` through both of the predicate's set lookups,
  // which is the right answer for a field whose type nobody declared.
  return def as ValueShapeFieldDef;
}

/**
 * Does this relationship field store MANY parent ids rather than one?
 *
 * The seam's verdict, exposed on its own because a caller sometimes needs the
 * ANSWER without the condition — the raw-URL related-list path, whose
 * `filter[<field>]=<value>` grammar has no membership operator, has to know
 * the arity in order to REFUSE. Deriving it a second time at that call site is
 * how the two compilers this module exists to merge came about, so it is
 * derived once here and read from both shapes below.
 */
export function isMultiValueRelationship(
  fields: FieldContainerLike,
  fieldName: string | undefined,
): boolean {
  const def = parentRelationshipFieldDef(fields, fieldName);
  return def !== undefined && isMultiValueField(def);
}

/**
 * The parent-relationship condition, compiled to match the field's ARITY.
 *
 *   - single-valued → `{ [relationshipField]: parentId }` — equality, byte for
 *     byte what both surfaces have always sent;
 *   - `multiple: true` (per the spec predicate) →
 *     `{ [relationshipField]: { $contains: parentId } }` — MEMBERSHIP, because
 *     the stored value is an ARRAY of ids and equality asks whether that whole
 *     array IS one id. `$contains` is the spelling the drivers execute for it,
 *     the one `driver-sql` names in the `400 INVALID_FILTER` it answers the
 *     equality form with.
 *
 * The author never writes either: they named a relationship, and its storage
 * form is the renderer's business.
 *
 * The return value is the plain MongoDB-style object both call sites have
 * always put on the wire, NOT a lowered ObjectQL AST. That is deliberate: with
 * nothing else declared the query must stay byte-identical to what it was, and
 * a freshly lowered AST would mean the same thing, be invisible on screen, and
 * break every caller pinning the wire. Composition with a list's own declared
 * scope stays the caller's step, through `mergeFilterNodes`.
 *
 * @param relationshipField  The child field pointing back at the parent.
 * @param parentId           The parent record's primary key value.
 * @param fields             The CHILD object's field defs (`objectSchema.fields`),
 *                           in either served shape. Without them the condition
 *                           compiles to equality — the historical wire, and the
 *                           only answer available to a caller that cannot see
 *                           the metadata. A caller that CAN see it must pass it.
 */
export function composeParentScopeFilter(
  relationshipField: string,
  parentId: string | number,
  fields?: FieldContainerLike,
): Record<string, unknown> {
  const multi = isMultiValueRelationship(fields, relationshipField);
  return { [relationshipField]: multi ? { $contains: parentId } : parentId };
}
