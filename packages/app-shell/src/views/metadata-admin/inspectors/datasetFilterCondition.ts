// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Bridge between the visual {@link FilterBuilder} (a flat `FilterGroup` of
 * `{field, operator, value}` rows, camelCase operators) and the spec
 * `FilterCondition` (Mongo-style `{ field: { $op: value } }`, conjoined with
 * `$and`) stored on `dataset.filter` / `measure.filter`.
 *
 * Scope (deliberate): the visual editor supports the common case — a flat AND
 * of simple `field op value` conditions. Anything it can't faithfully round-trip
 * (nested groups, `$or`, multi-operator objects, unmapped operators) is reported
 * as NOT representable so the caller can fall back to the source editor instead
 * of silently corrupting the author's filter.
 *
 * The value-less operators are the exception to "field op value": the builder
 * draws no input for them, so the row is complete without one. Both pairs the
 * spec's vocabulary carries — `$exists` (is empty) and `$null` (is null) — are
 * bridged here, in {@link VALUELESS_TO_MONGO}.
 */

/** FilterBuilder camelCase operator → FilterCondition Mongo operator. */
const OP_TO_MONGO: Record<string, string> = {
  equals: '$eq', notEquals: '$ne',
  greaterThan: '$gt', greaterOrEqual: '$gte', lessThan: '$lt', lessOrEqual: '$lte',
  after: '$gt', before: '$lt',
  contains: '$contains', in: '$in', notIn: '$nin',
};
const MONGO_TO_OP: Record<string, string> = {
  $eq: 'equals', $ne: 'notEquals',
  $gt: 'greaterThan', $gte: 'greaterOrEqual', $lt: 'lessThan', $lte: 'lessOrEqual',
  $contains: 'contains', $in: 'in', $nin: 'notIn',
};

/**
 * Value-less builder operators, and the predicate each one lowers to.
 *
 * A row carrying one of these is COMPLETE without a value — the builder draws
 * no input for it — so they are matched ahead of the value-completeness check
 * in {@link groupToCondition}, not after it.
 *
 * `isNull` / `isNotNull` are not a spelling of `isEmpty` / `isNotEmpty`. The
 * dropdown offers both pairs as their own rows and the spec's filter vocabulary
 * carries both `$null` and `$exists`, so they stay distinct in both directions;
 * collapsing them would draw two labels for one wire predicate and rewrite the
 * author's choice when the filter is read back.
 *
 * objectui#9363: the null pair was missing here, so an `Is null` row — an
 * ordinary entry in this inspector's menu, drawn as a finished row — fell
 * through to the unmapped-operator `continue` below and was dropped. Dropping
 * the last surviving row makes this function return `undefined`, and the
 * inspector commits that as `{ filter: undefined }`, the same patch shape used
 * to CLEAR the filter. So picking the entry erased the author's stored filter,
 * with no error and the condition still on screen.
 */
const VALUELESS_TO_MONGO: Record<string, Record<string, boolean>> = {
  isEmpty: { $exists: false }, isNotEmpty: { $exists: true },
  isNull: { $null: true }, isNotNull: { $null: false },
};

export interface BuilderCondition { id?: string; field: string; operator: string; value?: unknown }
export interface BuilderGroup { id?: string; logic: 'and' | 'or'; conditions: BuilderCondition[] }

/**
 * The ObjectQL filter AST, owned by `@objectstack/spec/data`.
 *
 * This was `Record<string, any>` — a local declaration under the spec's own
 * name that carried none of its structure (objectstack#4115). Re-exporting the
 * real recursive type restores `$and` / `$or` / `$not` and the per-field
 * operator shape, so the bridge below is checked against what actually gets
 * stored on `dataset.filter` / `measure.filter`.
 *
 * NOTE for the sibling batches: unlike `@object-ui/types` and
 * `@object-ui/components`, app-shell's `FilterCondition` was NOT the
 * FilterBuilder row — that concept lives here under its own name,
 * `BuilderCondition` (above), and needed no rename. Do not fold this one into
 * the `FilterBuilderCondition` rename.
 */
export type { FilterCondition } from '@objectstack/spec/data';

import type { FilterCondition } from '@objectstack/spec/data';

/** Serialize the visual group → a spec FilterCondition (flat `$and`). */
export function groupToCondition(group: BuilderGroup | undefined): FilterCondition | undefined {
  const conds = (group?.conditions ?? []).filter((c) => c && c.field);
  const parts: FilterCondition[] = [];
  for (const c of conds) {
    const valueless = VALUELESS_TO_MONGO[c.operator];
    if (valueless) { parts.push({ [c.field]: { ...valueless } }); continue; }
    const mop = OP_TO_MONGO[c.operator];
    // Still dropped rather than emitted in a spelling that means something
    // else. ⚠️ The drop is not free: it is what erases the stored filter when
    // no other row survives (see VALUELESS_TO_MONGO), and this menu offers
    // `notContains` / `between` / `startsWith` / `endsWith`, none of which this
    // table maps. Mapping one is a per-operator decision — `between` needs a
    // both-bounds-present rule before it can be emitted at all — so they are
    // declared, and pinned, in `datasetFilterCondition.nullOperators-9363`.
    if (!mop) continue;
    // Skip incomplete rows (no value typed yet) — emitting `{field:{$op:''}}` would
    // be a silently-wrong filter (matches only empty), not "no filter".
    const v = c.value;
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    parts.push({ [c.field]: { [mop]: v } });
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/**
 * Parse a stored FilterCondition → the visual group. `representable: false` when
 * the condition uses shapes the flat builder can't faithfully edit (nested
 * `$and`/`$or`, multi-op objects, unmapped operators) — callers should then show
 * the source editor instead.
 */
export function conditionToGroup(cond: FilterCondition | undefined | null): { group: BuilderGroup; representable: boolean } {
  const empty: BuilderGroup = { id: 'g', logic: 'and', conditions: [] };
  if (cond == null) return { group: empty, representable: true };
  if (typeof cond !== 'object' || Array.isArray(cond)) return { group: empty, representable: false };
  if ('$or' in cond) return { group: empty, representable: false };

  const list: FilterCondition[] = Array.isArray((cond as any).$and) ? (cond as any).$and : [cond];
  const conditions: BuilderCondition[] = [];
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (!c || typeof c !== 'object' || Array.isArray(c)) return { group: empty, representable: false };
    if ('$and' in c || '$or' in c) return { group: empty, representable: false };
    const keys = Object.keys(c);
    if (keys.length !== 1) return { group: empty, representable: false };
    const field = keys[0];
    const v = (c as any)[field];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const opKeys = Object.keys(v);
      if (opKeys.length !== 1) return { group: empty, representable: false };
      const mop = opKeys[0];
      if (mop === '$exists') {
        conditions.push({ id: `c${i}`, field, operator: v.$exists ? 'isNotEmpty' : 'isEmpty', value: '' });
      } else if (mop === '$null') {
        // The inverse of the write half: `$null: false` is "is not null", so
        // the boolean picks the operator rather than becoming the row's value.
        // Without this arm a filter this bridge now WRITES would read back as
        // non-representable, sending the author to the Source tab for a row the
        // builder can draw.
        conditions.push({ id: `c${i}`, field, operator: v.$null ? 'isNull' : 'isNotNull', value: '' });
      } else {
        const op = MONGO_TO_OP[mop];
        if (!op) return { group: empty, representable: false };
        conditions.push({ id: `c${i}`, field, operator: op, value: v[mop] });
      }
    } else {
      conditions.push({ id: `c${i}`, field, operator: 'equals', value: v }); // implicit equality
    }
  }
  return { group: { id: 'g', logic: 'and', conditions }, representable: true };
}
