// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Which lint scope a SCHEMA-DRIVEN condition editor claims, decided by the
 * metadata type being edited (objectui#8167).
 *
 * ## The defect
 *
 * `SchemaForm` routes a field to the CEL condition builder by NAME CONVENTION
 * (`visible` / `hidden` / `disabled` / `visibleOn` / `condition` / `predicate`
 * / `*When`), so one widget serves every metadata type. It claimed no scope, so
 * every such field fell through to `celAuthoring`'s own `hint.scope ??
 * 'flattened'` default — and a bare `status == 'done'` typed into an action's
 * **Visible when** linted CLEAN while the runtime binds the row as the `record`
 * ROOT and never matches it. The editor issued a receipt the runtime refuses.
 *
 * ## Why a TABLE and not one value
 *
 * The widget's surface is whatever the host schema points it at, so no single
 * scope is right for it: `record` is right where the evaluator binds a row, and
 * refusing the bare shorthand on the flow / RLS tiers — which are NOT row
 * surfaces (objectui#5738 stand-down 3) — would narrow a surface with no defect.
 * The one place that knows which tier is on screen is the host that is editing
 * a metadata type, so the scope originates there and rides
 * {@link WidgetContext.conditionScope}, required at construction.
 *
 * ## The verdicts are RULED, not derived here
 *
 * Every row below is the director seat's ruling of 2026-09-17 (batch #150 item
 * 5, letter B with the derivation table; maintainer 「同意」), which applies the
 * earlier rule — *a mount's lint scope is decided by what the evaluator binds at
 * runtime* — once per tier, from readings already taken on that thread:
 *
 *   • action `visible` / `disabled` / `enabled` → `record`: a row surface by
 *     `rowPredicateCanon.ts`'s own words.
 *   • validation rule `condition` → `record`: objectql's rule validator binds
 *     `{ record, previous }` and fail-closes on an unevaluable predicate, so a
 *     bare reference rejects every write to the object.
 *   • hook `condition` → `record`: `wrapDeclarativeHook` evaluates it as
 *     `{ record: record ?? {}, previous }` and throws on an unevaluable one.
 *     Landed at the curated hook inspector in objectui#9643; this is the same
 *     verdict reaching the generic form.
 *   • flow node `condition` → `flattened`: the flow tier is not a row surface.
 *   • permission / RLS row condition → `flattened`: RLS is not a row surface.
 *   • page block `visibleWhen` → `none`: its evaluator binds `record` +
 *     `current_user` + `page.<var>`, and NEITHER lint scope expresses that set —
 *     at `record` the validator refuses `page.<var>`, which is the spec's own
 *     worked example for the key, with the nonsense remedy `record.page`. It
 *     becomes `record` once the engine gains the `page` root (objectstack#18554
 *     or the no-objectstack fourth option recorded there); ⛔ this card does not
 *     wait on it.
 *   • any type without a row → `none`.
 *
 * ⛔ Do not re-open a row here. A tier whose runtime binding has actually
 * CHANGED is a new reading and a new ruling, not an edit to this table.
 *
 * ## `none` is a decision, not an absence
 *
 * `none` routes the field to the plain editor with no lint claim at all — the
 * option-D shape, taken per row. It is NOT the same as omitting a scope: an
 * omitted scope still renders the builder and still lets `celAuthoring`'s
 * `flattened` default answer, which is the receipt-for-nothing this card exists
 * to stop.
 *
 * ## The table is exhaustive over the types the editor serves
 *
 * A type reaching this table with no row would take `none` silently — a lint
 * claim dropped by omission, which is exactly how the defect got in. So the
 * runtime fallback is `none` (a new type must never crash the editor) and
 * `ConditionWidget.conditionScope.test.tsx` is what makes it LOUD: it
 * enumerates the registered metadata resources and reddens on the first type
 * that has no row here.
 */
export type ConditionScope = 'record' | 'flattened' | 'none';

/**
 * The ruled table, one row per metadata type the editor serves.
 *
 * `satisfies` rather than an annotation so the KEY SET survives as a literal
 * union for the pin test to read back, while every value still has to be a
 * {@link ConditionScope}.
 */
export const CONDITION_SCOPE_BY_METADATA_TYPE = {
  /* ── `record` — the evaluator binds the row as the `record` root ─────── */
  action: 'record',
  hook: 'record',
  /**
   * ⚠️ RULED and correct, and today it has no live host through this table —
   * both halves matter, so both are written down.
   *
   * The verdict is the ruling's: a validation rule's `condition` is evaluated
   * by objectql's rule validator with `{ record, previous }` and nothing else,
   * and an unevaluable predicate there is fail-CLOSED, so a bare reference
   * rejects every write to the object. ⛔ Not re-openable here.
   *
   * What does NOT follow is that this row is what delivers it. The standalone
   * `validation` KIND is retired (ADR-0088; `anchors.validation-retired.test.ts`
   * pins it, and records that the kind is absent from the spec's registry), so
   * `ResourceEditPage` never legitimately receives this type. An object's
   * embedded rules are reached through the `__object_validation` anchor, whose
   * `editAs: 'validation'` opens `EmbeddedItemEditor` — and that editor builds
   * NO `WidgetContext` at all, so its form never consults this table. The
   * `record` verdict those conditions actually get today comes from the curated
   * `ObjectValidationsPanel`, which declares `scope="record"` at its own mount.
   *
   * ⇒ the row is the ruling written down and the answer waiting for a host, ⛔
   * not a claim that a host reads it. Successor: `EmbeddedItemEditor` deriving a
   * `WidgetContext` from its `editAs`, which is the one change that would put
   * every embedded child on this table.
   */
  validation: 'record',

  /* ── `flattened` — a real tier, and not a row surface ────────────────── */
  flow: 'flattened',
  permission: 'flattened',
  /** Row-level security: a rule condition, evaluated per row but bound flat —
   *  the objectui#5738 stand-down 3 surface, the same as `permission`. */
  sharing_rule: 'flattened',

  /* ── `none` — no lint claim this editor may honestly make ────────────── */
  /** Page blocks: `record` + `current_user` + `page.<var>`, which no lint
   *  scope expresses. See the `page block` bullet above. */
  page: 'none',

  /* ── `none` — the ruling's last row: a type without a row of its own ─── */
  __object_field: 'none',
  __object_index: 'none',
  __object_validation: 'none',
  analytics_cube: 'none',
  api: 'none',
  app: 'none',
  agent: 'none',
  book: 'none',
  connector: 'none',
  dashboard: 'none',
  datasource: 'none',
  email_template: 'none',
  field: 'none',
  index: 'none',
  job: 'none',
  mapping: 'none',
  object: 'none',
  position: 'none',
  report: 'none',
  skill: 'none',
  tool: 'none',
  translation: 'none',
  view: 'none',
  webhook: 'none',
} satisfies Record<string, ConditionScope>;

/** Every metadata type {@link CONDITION_SCOPE_BY_METADATA_TYPE} rules, as a union. */
export type RuledMetadataType = keyof typeof CONDITION_SCOPE_BY_METADATA_TYPE;

/**
 * The scope a host editing `type` must declare on its {@link WidgetContext}.
 *
 * Falls back to `none` for an unruled type — the editor must keep working for a
 * metadata type this build has never heard of, and `none` is the only answer
 * that claims nothing. ⚠️ That fallback is NOT where a new type is meant to
 * land: the pin test enumerates the registered types against the table, so a
 * new one is a red test before it is ever a silent `none`.
 */
export function conditionScopeForMetadataType(type: string): ConditionScope {
  const table: Record<string, ConditionScope> = CONDITION_SCOPE_BY_METADATA_TYPE;
  return table[type] ?? 'none';
}
