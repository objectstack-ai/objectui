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
 *   - is-null FLAG  `filter[field][null]=true`         → `[field, 'is_null', true]`
 * A date-bucket drill emits `gte` + `lt` to scope a list to a time bucket; an
 * EMPTY-bucket drill emits the is-null flag (objectui#9159).
 */

/** Filter triple shape shared with view metadata: [field, operator, value]. */
export type FilterTriple = [string, string, unknown];

/** URL range/comparison operator suffix → ObjectQL operator (READ side). */
export const URL_FILTER_OPS: Record<string, string> = { gte: '>=', lte: '<=', gt: '>', lt: '<' };

/** ObjectQL range operator key → URL param suffix (WRITE side). Inverse of the
 *  relevant `URL_FILTER_OPS` entries. */
export const RANGE_OP_PARAM: Record<string, string> = { $gte: 'gte', $lte: 'lte', $gt: 'gt', $lt: 'lt' };

/**
 * The is-null operator (objectui#9159), in the ONE place both sides read it
 * from, so the write and read halves cannot drift apart on its spelling.
 *
 * ## Its URL value is a FLAG, not a comparand — and that is the whole design
 *
 * Every other member of this vocabulary carries a value the user is filtering
 * BY. This one carries no value at all: the condition is "this dimension is
 * empty". So the param exists to be present, and `true` is the only spelling
 * that means it. Two consequences, both deliberate and both pinned:
 *
 *   - `filter[field][null]=false` is NOT a second operator. This dialect cannot
 *     WRITE "is not null" (nothing here emits it, and inventing a read-side-only
 *     operator would be a second contract with no producer), so the read side
 *     drops that param exactly as it drops an unknown suffix — never downgraded
 *     to `is_null false`, never to an equality against the string `"false"`.
 *   - equality-to-empty-string is not a substitute: `parseUrlFilterTriples`
 *     skips a param whose value is `''`, so `filter[owner]=` round-trips to no
 *     condition at all. The flag's value is a non-empty literal for that reason.
 *
 * ⚠️ `param` is deliberately NOT an entry in {@link URL_FILTER_OPS}. That map is
 * the RANGE vocabulary, and `ObjectDataPage` inverts it to bridge a triple's
 * operator to the spec's own alias spelling. `op` here is already a canonical
 * `ViewFilterRule` operator word, so bridging it would map it to the alias
 * `'null'`, which `normalizeFilterOperator` passes through verbatim and the rule
 * schema then rejects — a saved view that silently loses this condition. Keeping
 * the flag out of the range map is what keeps "Save as view" correct.
 *
 * ⚠️ Known unspelled synonyms, recorded rather than closed: `convertFiltersToAST`
 * also lowers `{ $exists: false }` to is-null and `{ $null: false }` /
 * `{ $exists: true }` to `is_not_null`. This dialect spells none of those, so a
 * drill carrying one still degrades to a superset here — the same boundary this
 * card closed for `{ $null: true }`, for producers nothing on this path emits
 * today.
 */
export const NULL_FILTER = {
  /** URL param suffix: `filter[<field>][null]`. */
  param: 'null',
  /** The ONLY param value that spells the condition. */
  flag: 'true',
  /** ObjectQL operator it reads back as — what `convertFiltersToAST` emits for `{ $null: true }`. */
  op: 'is_null',
  /** ObjectQL operator-object key the WRITE side recognizes. */
  key: '$null',
  /**
   * i18n key for this operator's user-visible label, reused from the filter
   * builder's operator family rather than forked: all ten packs already define
   * and translate it, and that family already has a locale-parity pin. The chip
   * arm below hands this OUT; resolving it is the render site's job.
   */
  labelKey: 'filterBuilder.operators.isNull',
} as const;

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
 * Parse `filter[<field>]=<value>` (equality), `filter[<field>][<op>]=<value>`
 * (range/comparison) and `filter[<field>][null]=true` ({@link NULL_FILTER}, the
 * is-null flag) search params into ObjectQL triples. An unknown operator suffix
 * is ignored (never silently downgraded to equality).
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
    if (suffix === NULL_FILTER.param) {
      // A flag, so only its one spelling is the condition; anything else here
      // (`false` included) is dropped like an unknown suffix rather than
      // answered at an operator this dialect cannot write.
      if (value === NULL_FILTER.flag) out.push([field, NULL_FILTER.op, true]);
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
 * The is-null flag ({@link NULL_FILTER}) is a suffixed form, so this arm drops
 * it too — the boundary below applies to it unchanged (objectui#9159).
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
 * range operator object (`{ $gte, $lt }`) becomes `filter[field][gte|lt]`;
 * `{ $null: true }` — what an EMPTY-bucket drill carries — becomes the
 * `filter[field][null]` flag ({@link NULL_FILTER}); a plain value becomes
 * `filter[field]`. `null`/`undefined` values and objects with no recognized
 * operator are skipped (drill degrades to a superset) rather than stringified to
 * `"[object Object]"`.
 *
 * ⚠️ A JS `null` VALUE stays "no condition", and is not the is-null spelling: it
 * is what a producer writes when it has nothing to say about the field. The
 * empty bucket says something, and says it as `{ $null: true }` (objectui#9085).
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
      const ops = value as Record<string, unknown>;
      // The is-null FLAG (objectui#9159). Emitted BESIDE any range bound on the
      // same object rather than instead of it, because `convertFiltersToAST`
      // emits both conditions for that input and the two drill sinks agreeing is
      // the point. Only `true` writes it: `{ $null: false }` is "is not null",
      // an operator this dialect cannot spell, so it falls through and the drill
      // degrades to a superset exactly as it does for any other operator absent
      // from the maps above.
      if (ops[NULL_FILTER.key] === true) {
        params.set(`filter[${field}][${NULL_FILTER.param}]`, NULL_FILTER.flag);
      }
      for (const [op, suffix] of Object.entries(RANGE_OP_PARAM)) {
        const bound = ops[op];
        if (bound != null) params.set(`filter[${field}][${suffix}]`, String(bound));
      }
      continue; // handled (flag / range ops) or skipped — never String(object)
    }
    // Arrays reach here as `$in`-style comparands this dialect cannot spell;
    // skipping keeps the promise above (never `String(array)`).
    if (Array.isArray(value)) continue;
    params.set(`filter[${field}]`, String(value));
  }
}

/**
 * Delete the equality param AND every operator param (both range bounds, and the
 * is-null flag) for a field, so removing a date-range chip drops the whole range
 * together (#1752) and removing an empty-bucket chip drops its flag
 * (objectui#9159). Prefix-based, so it covers a suffix by construction rather
 * than by listing one — a new operator is removable the day it is writable.
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
 * One display chip: a field, plus the ONE of two carriers its operator needs.
 *
 * The split is not stylistic — it is the line between text this module may
 * finish and text it may not (objectui#9159, applying objectui#8441). A range
 * or equality chip's content is the USER'S OWN comparand, which no catalogue
 * can translate and which reads the same in every locale, so it is finished
 * here as `text`. An is-null chip's content is PROSE this module would
 * otherwise hard-code in English for every reader on every locale; it therefore
 * travels as `textKey` and is resolved at the render site, which already
 * translates the field half of the same chip.
 */
export interface FilterChip {
  field: string;
  /** Finished, language-neutral text (a comparand, a pair of range bounds). */
  text?: string;
  /** i18n key whose translation IS this chip's text. Mutually exclusive with `text`. */
  textKey?: string;
}

/**
 * Group filter triples into ONE display chip per field, preserving first-seen
 * order. A date-bucket drill contributes two triples for the same field
 * (`>= start`, `< end`); they collapse into a single `start → end` range chip.
 *
 * The is-null flag gets its own arm (objectui#9159). Without it the flag fell
 * to the `= <value>` default and the chip read `= true` — a condition the user
 * never wrote, against a value the object does not hold, on the one drill whose
 * whole point is that the field is EMPTY. It is checked first so a field
 * carrying the flag can never render as that bare `true`.
 *
 * That arm is the only one that yields `textKey` rather than `text`, for the
 * reason on {@link FilterChip}. The key is the filter builder's existing
 * operator key, already present and already translated in all ten packs, and
 * already policed by that family's locale-parity pin — ⛔ not a second string
 * forked for this chip, which would put two spellings of one operator label at
 * rest in one product.
 */
export function groupFilterChips(triples: FilterTriple[]): FilterChip[] {
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
    if (list.some(([, op]) => op === NULL_FILTER.op)) {
      return { field, textKey: NULL_FILTER.labelKey };
    }
    const gte = list.find(([, op]) => op === '>=' || op === '>');
    const lt = list.find(([, op]) => op === '<' || op === '<=');
    const text =
      gte || lt
        ? `${gte ? String(gte[2]) : '…'} → ${lt ? String(lt[2]) : '…'}`
        : `= ${String(list[0][2])}`;
    return { field, text };
  });
}
