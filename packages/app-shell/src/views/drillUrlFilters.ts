/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * URL filter (de)serialization shared by the drill "escape hatch"
 * (`useOpenRecordList`, the WRITE side) and the ADR-0055 bare data surface
 * (`ObjectDataPage`, the READ side). Keeping both sides in ONE module keeps the
 * `filter[<field>][<op>]` operator contract (#1752) from drifting between the
 * code that emits a URL and the code that parses it back.
 *
 * Contract:
 *   - equality      `filter[field]=value`              → `[field, '=', value]`
 *   - range / cmp   `filter[field][gte|lte|gt|lt]=v`   → `[field, '>=' | … , v]`
 * A date-bucket drill emits `gte` + `lt` to scope a list to a time bucket.
 */

/** Filter triple shape shared with view metadata: [field, operator, value]. */
export type FilterTriple = [string, string, unknown];

/** URL range/comparison operator suffix → ObjectQL operator (READ side). */
export const URL_FILTER_OPS: Record<string, string> = { gte: '>=', lte: '<=', gt: '>', lt: '<' };

/** ObjectQL range operator key → URL param suffix (WRITE side). Inverse of the
 *  relevant `URL_FILTER_OPS` entries. */
export const RANGE_OP_PARAM: Record<string, string> = { $gte: 'gte', $lte: 'lte', $gt: 'gt', $lt: 'lt' };

/**
 * The ONE grammar for a key in this family, so the two arms below cannot drift
 * apart on what a field name is: `filter[<field>]`, with an OPTIONAL
 * `[<suffix>]`. The field slot excludes both brackets, so a suffix can never be
 * swallowed into the field name — the drift objectui#9196 measured, where a
 * greedy field capture turned `filter[amount][gte]` into a condition against a
 * field literally named `amount][gte` that no object declares.
 */
const FILTER_KEY = /^filter\[([^[\]]+)\](?:\[([^[\]]+)\])?$/;

/**
 * Parse `filter[<field>]=<value>` (equality) and `filter[<field>][<op>]=<value>`
 * (range/comparison) search params into ObjectQL triples. An unknown operator
 * suffix is ignored (never silently downgraded to equality).
 */
export function parseUrlFilterTriples(searchParams: URLSearchParams): FilterTriple[] {
  const out: FilterTriple[] = [];
  searchParams.forEach((value, key) => {
    if (value === '') return;
    const m = FILTER_KEY.exec(key);
    if (!m) return;
    const [, field, suffix] = m;
    if (suffix === undefined) {
      out.push([field, '=', value]);
      return;
    }
    const op = URL_FILTER_OPS[suffix];
    if (op) out.push([field, op, value]);
  });
  return out;
}

/**
 * The EQUALITY-ONLY arm of the same grammar, for a surface that implements
 * `filter[<field>]=<value>` and nothing else — today the plain object route
 * (`/apps/:app/:object`, `ObjectView`), whose related-list "View All" buttons
 * scope a destination list to one parent record.
 *
 * An operator suffix is DROPPED, exactly as `parseUrlFilterTriples` drops an
 * operator it does not know: ignored, and in particular never silently
 * downgraded to equality. Those are two different outcomes and only one is
 * correct — answering the narrower `amount = 100` when the URL asked for
 * `amount >= 100` is a wrong answer wearing a right answer's shape.
 *
 * ⚠️ This arm deliberately does NOT execute the operator suffix (objectui#9196).
 * Teaching this route range operators would widen the accepted set of an
 * addressable public surface — a behaviour addition, not a repair, and one that
 * belongs to the maintainer rather than to a bug fix. The operator arm stays
 * where it already is: `parseUrlFilterTriples`, on the ADR-0055 `/data` surface.
 */
export function parseUrlEqualityFilterTriples(searchParams: URLSearchParams): FilterTriple[] {
  const out: FilterTriple[] = [];
  searchParams.forEach((value, key) => {
    if (value === '') return;
    const m = FILTER_KEY.exec(key);
    // `m[2] !== undefined` is the suffixed form — not executable here, so the
    // whole condition is dropped rather than answered at the wrong operator.
    if (!m || m[2] !== undefined) return;
    out.push([m[1], '=', value]);
  });
  return out;
}

/**
 * Serialize a drill filter object into `filter[...]` search params. An ObjectQL
 * range operator object (`{ $gte, $lt }`) becomes `filter[field][gte|lt]`; a
 * plain value becomes `filter[field]`. `null`/`undefined` values and objects
 * with no recognized operator are skipped (drill degrades to a superset) rather
 * than stringified to `"[object Object]"`.
 *
 * ## `$and` is flattened, because this dialect's conjunction is implicit
 *
 * A drill filter composed from more than one source arrives as
 * `{ $and: [<widget filter>, <click context>] }` — what `composeDrillFilter`
 * (`@object-ui/core`) lowers `widget.filter ∧ drill.filter` to (objectui#8944).
 * The READ side already returns a FLAT list of triples that the query layer ANDs
 * together, so a top-level `$and` is expressible here: emit each child's params
 * into the same set and `parseUrlFilterTriples` reads the conjunction straight
 * back. Nesting is walked too, since composing three sources nests.
 *
 * ⚠️ Without this branch a composed filter took the `String(value)` path below —
 * `$and` holds an ARRAY, so it was neither `null` nor a non-array object — and
 * the URL grew a bogus `filter[$and]=[object Object],[object Object]` while BOTH
 * real conditions vanished. That is the very outcome this function's contract
 * says it never produces, and it is wrong in the widening direction: the list
 * lands unscoped by anything the user actually clicked.
 *
 * ⚠️ Two conditions on the SAME field and operator are NOT expressible here (one
 * param key, one value). The later source wins, so a click context still
 * overrides the widget's condition on that field exactly as it did when this
 * value was built by spreading — the drill degrades to a superset there, the
 * same posture this function already takes for operators it cannot spell.
 */
export function serializeDrillFilterParams(
  filter: Record<string, unknown> | undefined,
): URLSearchParams {
  const params = new URLSearchParams();
  if (!filter) return params;
  collectFilterParams(filter, params);
  return params;
}

/** One source's conditions, written into the shared param set. Recurses on `$and`. */
function collectFilterParams(filter: Record<string, unknown>, params: URLSearchParams): void {
  for (const [field, value] of Object.entries(filter)) {
    if (value == null) continue;
    if (field === '$and' && Array.isArray(value)) {
      // Implicit-AND dialect: each child contributes its own params, in order,
      // so a later source overrides an earlier one on a field they share.
      for (const child of value) {
        if (child && typeof child === 'object' && !Array.isArray(child)) {
          collectFilterParams(child as Record<string, unknown>, params);
        }
      }
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, suffix] of Object.entries(RANGE_OP_PARAM)) {
        const bound = (value as Record<string, unknown>)[op];
        if (bound != null) params.set(`filter[${field}][${suffix}]`, String(bound));
      }
      continue; // handled (range ops) or skipped — never String(object)
    }
    // Arrays reach here as `$in`-style comparands this dialect cannot spell;
    // skipping keeps the promise above (never `String(array)`).
    if (Array.isArray(value)) continue;
    params.set(`filter[${field}]`, String(value));
  }
}

/**
 * Delete the equality param AND every operator param (both range bounds) for a
 * field, so removing a date-range chip drops the whole range together (#1752).
 * Mutates and returns `params`.
 */
export function deleteFieldFilterParams(params: URLSearchParams, field: string): URLSearchParams {
  const prefix = `filter[${field}]`;
  for (const key of Array.from(params.keys())) {
    if (key === prefix || key.startsWith(`${prefix}[`)) params.delete(key);
  }
  return params;
}

/**
 * Group filter triples into ONE display chip per field, preserving first-seen
 * order. A date-bucket drill contributes two triples for the same field
 * (`>= start`, `< end`); they collapse into a single `start → end` range chip.
 */
export function groupFilterChips(triples: FilterTriple[]): Array<{ field: string; text: string }> {
  const order: string[] = [];
  const byField = new Map<string, FilterTriple[]>();
  for (const tr of triples) {
    if (!byField.has(tr[0])) {
      byField.set(tr[0], []);
      order.push(tr[0]);
    }
    byField.get(tr[0])!.push(tr);
  }
  return order.map((field) => {
    const list = byField.get(field)!;
    const gte = list.find(([, op]) => op === '>=' || op === '>');
    const lt = list.find(([, op]) => op === '<' || op === '<=');
    const text =
      gte || lt
        ? `${gte ? String(gte[2]) : '…'} → ${lt ? String(lt[2]) : '…'}`
        : `= ${String(list[0][2])}`;
    return { field, text };
  });
}
