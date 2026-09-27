// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * screen-spec — pure helpers that map a flow `screen` node's authored `config`
 * onto the runtime `ScreenSpec` (the contract {@link ScreenView} renders), plus
 * `{var}` interpolation for the title/description and the Studio's step-level
 * diagnostics for a field's `visibleWhen`. Kept framework-free so
 * {@link ScreenPreview} stays a thin component and these stay unit-testable.
 *
 * ## One client evaluator for `visibleWhen` (objectui#10743)
 *
 * A screen field's `visibleWhen` is bare CEL over the screen's own declared
 * fields plus the values being collected — the spec's `ScreenFieldSpec.visibleWhen`
 * docblock: "evaluated by the CLIENT against the screen's live collected
 * values — not by the server". The Studio therefore does NOT decide a field's
 * visibility up front. {@link buildScreenSpec} hands the predicate to
 * `ScreenView` raw, and the renderer's `visibleScreenFields` /
 * `screenPredicateScope` decide it live as the author ticks and types into the
 * preview — the same code path that decides it for the end user in the flow
 * runner. There is no second copy of that evaluation in this module.
 *
 * Before objectui#10743 this module judged each predicate once, at the pause,
 * against the run's variables (the reading the runtime's resume door takes),
 * dropped every field it judged hidden and stripped the predicate from the
 * rest. A predicate over a sibling screen field — the only shape any shipped
 * producer writes (`createOpportunity == true`, `discount > 0`) — names a value
 * the run does not hold at the pause, so the field was judged hidden and stayed
 * hidden however the author ticked or typed: the "frozen visible-or-hidden for
 * the life of the screen" outcome the runtime's `screen` executor forwards the
 * predicate raw to avoid.
 *
 * What this module still judges is the SCOPE, never the value:
 * {@link unevaluableVisibleWhen} names a predicate the screen renderer cannot
 * bind — one that references an identifier that is not a field declared on
 * this screen, or one whose shape `registerFlow` refuses — so the Debug run's
 * screen step can say so. Whether a faulting predicate shows or hides its field
 * is the renderer's fallback and objectui#8069's question; the Studio renders
 * through that renderer and states no direction of its own.
 *
 * ⚠️ The server's resume door (`refuseInvalidScreenInput` in
 * `@objectstack/service-automation`) still evaluates `visibleWhen` over the
 * run's variables with the submitted values layered on top until
 * objectstack#20178 lands. That is the divergence objectui#10743 measured; it is
 * closed on the server side, not by widening the client's scope.
 */

import { collectCelRootIdentifiers, nearestName, validateExpression } from '@objectstack/formula';
import { predicateSlotRefusal } from '@objectstack/spec/automation';
import {
  screenFields,
  screenPredicateScope,
  visibleScreenFields,
  type ScreenFieldSpec,
  type ScreenSpec,
} from '../../ScreenView.js';

/** Minimal node shape the preview needs (id + authored config). */
export interface ScreenPreviewNode {
  id: string;
  label?: string;
  config?: Record<string, unknown>;
}

/**
 * Interpolate `{var}` references, mirroring the simulator's `{var}` syntax
 * (flow-simulator.ts). Known vars are substituted; unknown refs stay literal so
 * the author still sees the dependency in the design preview.
 */
export function interpolate(text: string | undefined, vars: Record<string, unknown> | undefined): string {
  if (!text) return '';
  if (!vars) return text;
  return text.replace(/\{([^{}]+)\}/g, (m, k) => {
    const v = vars[String(k).trim()];
    return v === undefined || v === null ? m : String(v);
  });
}

/**
 * The namespace `ScreenView` binds the collected values under beside their bare
 * names (`record.discount` resolves as `discount` does). The runner binds no
 * `previous`, so it is not admitted here either.
 */
const RECORD_ROOT = 'record';

/**
 * The roots a screen field's `visibleWhen` may reference, read off the
 * renderer's own predicate scope so the two cannot disagree: every field
 * declared on this screen, bare, plus {@link RECORD_ROOT}.
 */
function declaredPredicateRoots(spec: ScreenSpec): ReadonlySet<string> {
  return new Set([...Object.keys(screenPredicateScope(spec, {})), RECORD_ROOT]);
}

/** One field whose `visibleWhen` the screen renderer cannot evaluate, and why. */
export interface UnevaluableVisibleWhen {
  name: string;
  error: string;
}

/**
 * Why the screen renderer cannot evaluate one `visibleWhen`, or `undefined`
 * when it can: the predicate is absent or blank (no predicate — the installed
 * spec admits a blank one and the field is then always shown), or every root it
 * names is declared on this screen.
 *
 * Judged in the order `registerFlow` judges the slot, minus the evaluation:
 * the spec's shape refusal (a non-string), the CEL parse (`validateExpression`,
 * which refuses a `{var}` brace — the brace trap in a bare-CEL slot), then the
 * roots. A root that is not a declared field is named, with the nearest
 * declared field when one is close (`dicount` → `discount`).
 */
function visibleWhenScopeError(
  visibleWhen: unknown,
  roots: ReadonlySet<string>,
  declared: readonly string[],
): string | undefined {
  if (visibleWhen === undefined || visibleWhen === null) return undefined;
  if (typeof visibleWhen === 'string' && !visibleWhen.trim()) return undefined;
  const shape = predicateSlotRefusal(visibleWhen);
  if (shape) return shape.message;
  const source = visibleWhen as string;
  const parsed = validateExpression('predicate', source);
  if (parsed.errors.length > 0) return parsed.errors.map((e) => e.message).join(' ');
  const collected = collectCelRootIdentifiers(source);
  if (!collected.ok) return collected.error;
  const undeclared = collected.roots.filter((r) => !roots.has(r));
  if (undeclared.length === 0) return undefined;
  return undeclared
    .map((r) => {
      const near = nearestName(r, declared);
      return `\`${r}\` is not a field on this screen${near ? ` (did you mean \`${near}\`?)` : ''}`;
    })
    .join('; ');
}

/**
 * The authored field rows of a screen whose `visibleWhen` the screen renderer
 * cannot evaluate, with the reason — see {@link visibleWhenScopeError}. A
 * predicate over a sibling field (`createOpportunity == true`, `discount > 0`,
 * `record.discount > 0`) is not reported: the renderer decides it live. One
 * over a name the renderer never binds — a run variable such as
 * `needsApproval == true` on a screen with no `needsApproval` field, the `vars`
 * root the runtime's own scope carries — is, by field name, so the Debug run's
 * screen step can name it (objectui#10743).
 */
export function unevaluableVisibleWhen(node: ScreenPreviewNode): UnevaluableVisibleWhen[] {
  const raw = (node.config as Record<string, unknown> | undefined)?.fields;
  if (!Array.isArray(raw)) return [];
  const spec = buildScreenSpec(node);
  const roots = declaredPredicateRoots(spec);
  const declared = screenFields(spec).map((f) => f.name);
  const out: UnevaluableVisibleWhen[] = [];
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    const error = visibleWhenScopeError(row.visibleWhen, roots, declared);
    if (error) out.push({ name: row.name, error });
  }
  return out;
}

/**
 * Coerce the authored `config.fields` rows into runtime `ScreenFieldSpec`s. A
 * field's `visibleWhen` is carried RAW, as the runtime `screen` executor sends
 * it to the client, so `ScreenView` decides it live against the values the
 * author is collecting in the preview (objectui#10743). Nothing is dropped
 * here: a field whose predicate is false right now is hidden by the renderer
 * and comes back the moment the values make it true.
 */
function toScreenFields(raw: unknown): ScreenFieldSpec[] {
  if (!Array.isArray(raw)) return [];
  const out: ScreenFieldSpec[] = [];
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    out.push({
      name: row.name,
      label: typeof row.label === 'string' ? row.label : undefined,
      type: typeof row.type === 'string' ? row.type : undefined,
      required: row.required === true,
      ...(typeof row.visibleWhen === 'string' ? { visibleWhen: row.visibleWhen } : {}),
    });
  }
  return out;
}

/**
 * How many of the screen's fields their `visibleWhen` hides for the values
 * collected so far — the renderer's own verdict (`visibleScreenFields`), so the
 * preview's hint and the form it sits under cannot disagree.
 */
export function hiddenFieldCount(spec: ScreenSpec, values: Record<string, unknown>): number {
  return screenFields(spec).length - visibleScreenFields(spec, values).length;
}

/**
 * A designed screen always carries a (possibly empty) field list — `fields` is
 * optional on the WIRE type only, where a message-only / object-form pause may
 * omit it.
 */
export type DesignedScreenSpec = ScreenSpec & { fields: ScreenFieldSpec[] };

/**
 * Map a screen node's authored `config` onto the runtime `ScreenSpec` — the
 * same keys the engine's `screen` executor reads (title / description / fields
 * / objectName / mode / defaults / idVariable). Every authored field is kept,
 * with its `visibleWhen` raw; the renderer decides visibility.
 */
export function buildScreenSpec(node: ScreenPreviewNode): DesignedScreenSpec {
  const c = (node.config && typeof node.config === 'object' ? node.config : {}) as Record<string, unknown>;
  const objectName = typeof c.objectName === 'string' && c.objectName ? c.objectName : undefined;
  const mode = c.mode === 'edit' ? 'edit' : c.mode === 'create' ? 'create' : undefined;
  const defaults =
    c.defaults && typeof c.defaults === 'object' && !Array.isArray(c.defaults)
      ? (c.defaults as Record<string, unknown>)
      : undefined;
  return {
    nodeId: node.id,
    title: typeof c.title === 'string' ? c.title : undefined,
    description: typeof c.description === 'string' ? c.description : undefined,
    fields: toScreenFields(c.fields),
    kind: objectName ? 'object-form' : 'fields',
    objectName,
    mode,
    defaults,
    idVariable: typeof c.idVariable === 'string' ? c.idVariable : undefined,
  };
}
