/**
 * ObjectUI — the shared record-source readers: the ruled three-rung ladder
 * (`resolveRecordSourceConfig`) and the object-name it resolves to
 * (`resolveRecordSourceObjectName`)
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ViewData } from '@object-ui/types';

/**
 * The object a view block is bound to, resolved ONCE for the whole renderer
 * (objectui#7627).
 *
 * ## The question this answers, and the one it does not
 *
 * There are TWO separately-ruled precedence questions about `objectName`, and
 * they only look like one question when a single reader is asked to answer
 * both:
 *
 *  1. **Which object does this block RESOLVE, at render time, when it carries
 *     more than one binding?** — the published three-rung record-source ladder
 *     (`data`, then `staticData`, then `objectName`), declared on both faces of
 *     the contract (`ObjectMapSchema.objectName` / `ObjectGanttSchema.objectName`
 *     in `@object-ui/types`, and the `.describe` on their zod twins:
 *     *"objectName — the THIRD record source `getDataConfig` resolves, after
 *     `data` and `staticData`"*), ruled objectui#6939 (2026-09-02) and pinned by
 *     `objectql-record-source-refinement-6939.test.ts`. **That is this
 *     function.**
 *  2. **How does `objectName` get POPULATED when it is absent?** — the
 *     authoring-time gap-fill in `normalizeListViewSchema` (objectui#7477,
 *     ruling B of PR #7628), where an `objectName` already on the schema WINS
 *     and the `data` block only fills a gap: *"it can never re-point a binding
 *     that already resolves."*
 *
 * The two are NOT merged and neither is re-pointed at the other. Merging them
 * would override a standing maintainer ruling in whichever direction the merged
 * reader happened to pick: at the sites below the binding that already resolves
 * IS `data.object`, so ruling B's own words argue for keeping rung 1 as it is.
 *
 * ## Why `staticData` does not appear here
 *
 * The ladder's second rung wraps inline rows as `{ provider: 'value', items }`,
 * which names no object at all. So for the object-NAME question the three-rung
 * ladder reduces to two rungs — the resolved config's object when it names one,
 * else the schema's own `objectName`, which is what a `value`/`api`-backed block
 * still needs for metadata reads, i18n field labels and permission verdicts.
 * Callers pass the ALREADY-RESOLVED config (their `getDataConfig(schema)`
 * output), so rung ordering is settled before this function is reached.
 *
 * ## No lenient rung was added (AGENTS.md #0.1)
 *
 * `ViewDataSchema`'s `object` provider is a `strictObject` carrying exactly
 * `{ provider, object }` with `object` REQUIRED, so `{ provider: 'object' }`
 * without an `object` is off-contract. This reader does not coerce that shape
 * back to `objectName`; the two call sites that used to (`ObjectGrid`'s
 * `'object' in dataConfig` test and `ObjectTree`'s header `?? schema.objectName`
 * tail) keep their own tail at the site, so the collapse changes nothing they
 * resolve today while the shared rung stays contract-strict.
 *
 * @param schema - The block's schema; only `objectName` is read.
 * @param dataConfig - The RESOLVED data config — the caller's own
 *   `getDataConfig(schema)` output, `null` when nothing is bound.
 * @returns The bound object's name, or `undefined` when neither the resolved
 *   config nor the schema names one.
 *
 * @example
 * ```ts
 * const dataConfig = useMemo(() => resolveRecordSourceConfig(schema, 'view-data'), [schema]);
 * const objectName = resolveRecordSourceObjectName(schema, dataConfig);
 * ```
 */
export function resolveRecordSourceObjectName(
  schema: { objectName?: string } | null | undefined,
  dataConfig: { provider?: string; object?: string } | null | undefined,
): string | undefined {
  return dataConfig?.provider === 'object' ? dataConfig.object : schema?.objectName;
}

/**
 * Which arm of `data` a block's PUBLISHED row declares — the only shape rung 1
 * of the ladder honours for that block (objectui#8348).
 *
 * Maintainer ruling, decision batch #83 (2026-09-08), verbatim: 「8348 以协议为准」
 * — the contract decides. A renderer honours the `data` spelling its block's
 * published row declares and no other: what `os validate` and the save gate
 * refuse, the renderer refuses too.
 *
 *  - `'view-data'` — the row is the spec's `ViewData` discriminated union, four
 *    strict OBJECT arms on `provider`. A bare array under `data` is NOT a record
 *    source for such a block.
 *  - `'array'` — the row is `z.array(...)`: an array of PRE-FETCHED RECORDS. The
 *    `{ provider, items }` config object is NOT a record source for such a
 *    block.
 *  - `'undeclared'` — no published face declares a `data` row for the block at
 *    all, so neither arm of the ruling reaches it and rung 1 keeps its pre-8348
 *    verbatim behaviour. ⛔ NOT a tolerance to copy: it is the honest answer for
 *    a block the ruling does not decide, and it is reported rather than guessed.
 *
 * The arm is passed BY THE CALL SITE rather than looked up from `schema.type`
 * on purpose. Every one of these renderers is registered twice — `object-grid`
 * and the `view:grid` alias `grid`, `object-calendar` and `calendar`, and so on
 * — so a node reaches the same component under either spelling, and a table
 * keyed by `type` would answer for one tag and silently miss the other. A
 * REQUIRED parameter makes the arm a compile-time obligation at each of the
 * five sites instead.
 */
export type RecordSourceDataArm = 'view-data' | 'array' | 'undeclared';

/**
 * Does the authored `data` match the arm this block's published row declares?
 *
 * Falsy `data` is never a record source — the pre-8348 `if (schema.data)`
 * truthiness test, kept, so `data: null` and `data: undefined` still fall
 * through to `staticData`.
 */
function authoredDataIsOnTheDeclaredArm(authored: unknown, arm: RecordSourceDataArm): boolean {
  if (!authored) return false;
  if (arm === 'array') return Array.isArray(authored);
  if (arm === 'view-data') return !Array.isArray(authored);
  return true;
}

/**
 * The block's record source, resolved from the ruled three-rung ladder
 * (objectui#7632), with rung 1 judged against the block's own published `data`
 * row (objectui#8348).
 *
 * ## The ruled contract this is the ONE implementation of
 *
 * `data`, then `staticData`, then `objectName` — declared on both faces of the
 * published contract and pinned by
 * `objectql-record-source-refinement-6939.test.ts`:
 *
 *  1. **`data`** — *"Data source configuration. Read FIRST by `getDataConfig`"*,
 *     honoured ONLY on the arm `dataArm` names. Returned verbatim, so a config
 *     on the declared arm reaches the caller exactly as the author wrote it.
 *  2. **`staticData`** — *"Inline records — read SECOND by `getDataConfig`,
 *     wrapped into a `{ provider: value }` config"*.
 *  3. **`objectName`** — *"the THIRD record source `getDataConfig` resolves,
 *     after `data` and `staticData`"*, folded to `{ provider: 'object' }`.
 *
 * `null` when none of the three is present — the same "nothing is drawn" signal
 * the zod `requireRecordSource` refinement is written against.
 *
 * This is the PRODUCER whose output {@link resolveRecordSourceObjectName} (the
 * objectui#7627 reader) consumes; that function's docblock describes the same
 * ladder from the consuming end. Five plugins — calendar, gantt, grid, map and
 * tree — each carried a hand-copy of this ladder with no gate holding them
 * together, which is the AGENTS.md #0.1 drift class: a change to the ruled
 * order had five edit sites and nothing noticed a missed one.
 *
 * ## Rung 1 is judged against the block's own row (objectui#8348)
 *
 * ⛔ This docblock used to state, as a fact about the whole ladder, that *"an
 * array under `data` cannot be published"*. That is true of the blocks whose row
 * is `ViewData` and FALSE of `object-calendar`, whose published row
 * (`ComponentPropsMap['object-calendar'].data` on `@objectstack/spec` 17.4.0) is
 * `z.array(z.unknown()).optional()` — *"Pre-fetched records — skips the internal
 * fetch"*. Both directions of that disagreement were live at once: the renderers
 * honoured the `{ provider, items }` object on a block whose row refuses it by
 * kind, and `ObjectGrid` / `ObjectMap` lifted a bare array on blocks whose row
 * refuses THAT by kind. Decision batch #83 settled it — the row decides — and
 * `dataArm` is where each block says which row it has.
 *
 * MEASURED, per block, at the version this repo resolves:
 *
 *  - `object-grid` — `ComponentPropsMap['object-grid'].data` is the `ViewData`
 *    union, and its own description names the refusal: *"the bare-array shortcut
 *    is refused — see migration `object-grid-data-view-data-converged`"*.
 *    ⇒ `'view-data'`, and the site's normalizing head is gone.
 *  - `object-calendar` — `z.array(z.unknown()).optional()`, and the registration
 *    publishes the same arm (`{ name: 'data', type: 'array' }`). ⇒ `'array'`.
 *  - `object-map`, `object-gantt` — no `ComponentPropsMap` row exists for either
 *    block; the published row that governs them is this repo's own
 *    `ObjectMapSchema.data` / `ObjectGanttSchema.data`, both
 *    `ViewDataSchema.optional()`. ⇒ `'view-data'`, and `ObjectMap`'s normalizing
 *    head is gone too.
 *  - `object-tree` — NO published face declares a `data` row: not
 *    `ComponentPropsMap`, not `ObjectTreeSchema` (which declares `objectName`
 *    REQUIRED and no `data`), not the registration's `inputs`. Neither arm of
 *    the ruling reaches it, so it passes `'undeclared'` and nothing about it
 *    changes here.
 *
 * ## No lenient rung was added (AGENTS.md #0.1)
 *
 * **Null tolerance** stays out: all five copies dereference `schema` unguarded
 * and would throw on `null`; no site passes one, so no `?.` was added.
 *
 * `ObjectCalendar`'s copy guarded with `'data' in schema && schema.data`
 * because its parameter is the union `ObjectGridSchema | CalendarSchema` and
 * `CalendarSchema` declares neither `data` nor `staticData`. That `in` test is
 * a TYPESCRIPT narrowing device, not a behavioural one: when the property is
 * absent the read yields `undefined`, which is falsy either way, so the guard
 * can never change which rung is taken. The optional-property parameter below
 * accepts that union directly, which is why the guard is gone rather than
 * flattened away.
 *
 * @param schema - The block's schema; only `data`, `staticData` and
 *   `objectName` are read.
 * @param dataArm - The arm the CALLING BLOCK's published `data` row declares.
 *   Required: there is no repo-wide default, because the answer differs per
 *   block and a default is how the second de-facto contract got in.
 * @returns The resolved data config, or `null` when nothing is bound.
 *
 * @example
 * ```ts
 * const dataConfig = useMemo(() => resolveRecordSourceConfig(schema, 'view-data'), [schema]);
 * const objectName = resolveRecordSourceObjectName(schema, dataConfig);
 * ```
 */
export function resolveRecordSourceConfig(
  schema: {
    objectName?: string;
    data?: ViewData;
    staticData?: any[];
  },
  dataArm: RecordSourceDataArm,
): ViewData | null {
  if (authoredDataIsOnTheDeclaredArm(schema.data, dataArm)) {
    return schema.data as ViewData;
  }

  if (schema.staticData) {
    return {
      provider: 'value',
      items: schema.staticData,
    };
  }

  if (schema.objectName) {
    return {
      provider: 'object',
      object: schema.objectName,
    };
  }

  return null;
}
