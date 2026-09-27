// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * screen-spec — pure helpers that map a flow `screen` node's authored `config`
 * onto the runtime `ScreenSpec` (the contract {@link ScreenView} renders), plus
 * `{var}` interpolation for the title/description and the Studio's diagnostics
 * for a field's `visibleWhen`. Kept framework-free so {@link ScreenPreview}
 * stays a thin component and these stay unit-testable.
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
 * {@link screenVisibleWhenScopeError} names a predicate the screen renderer
 * cannot bind — one that references an identifier that is not a field declared
 * on this screen, or one whose shape `registerFlow` refuses — and
 * {@link unevaluableVisibleWhen} lists the fields it applies to, so the Debug
 * run's screen step and the Problems panel (`flow-expr-problems.ts`) can say so
 * from ONE rule. Whether a faulting predicate shows or hides its field is the
 * renderer's fallback and objectui#8069's question; the Studio renders through
 * that renderer and states no direction of its own.
 *
 * ⚠️ The server's resume door (`refuseInvalidScreenInput` in
 * `@objectstack/service-automation`) still evaluates `visibleWhen` over the
 * run's variables with the submitted values layered on top until
 * objectstack#20178 lands. That is the divergence objectui#10743 measured; it is
 * to be closed on the server side, not by widening the client's scope.
 */

import { collectCelRootIdentifiers, nearestName, parseCelToAst, validateExpression } from '@objectstack/formula';
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
 * The namespace `ScreenView`'s evaluator binds the collected values under
 * beside their bare names: `evalFieldPredicate(pred, scope, true, undefined,
 * scope)` hands the scope to the engine as `record` AND as the bare `extra`
 * roots, so `record.discount` resolves exactly as `discount` does. That
 * binding happens inside `evalFieldPredicate`, not in `screenPredicateScope`,
 * which is why the name is restated here rather than read off the scope; the
 * bare names ARE read off it ({@link screenPredicateRoots}). The runner binds
 * no `previous`, so it is not admitted here either.
 */
const RECORD_ROOT = 'record';

/**
 * The roots a screen field's `visibleWhen` may reference: every field declared
 * on this screen, bare — the keys of the renderer's own predicate scope,
 * `screenPredicateScope(spec, {})`, so a field the renderer seeds is a field
 * the diagnostics accept — plus {@link RECORD_ROOT}. The ONE rule the Debug
 * run's screen step and the Problems panel both judge against (objectui#10743).
 */
export function screenPredicateRoots(node: ScreenPreviewNode): Set<string> {
  return new Set([...Object.keys(screenPredicateScope(buildScreenSpec(node), {})), RECORD_ROOT]);
}

/**
 * CEL's comprehension macros. Their first argument declares an iteration
 * variable that is bound inside the macro's body — `["a","b"].exists(t, t ==
 * note)` binds `t` — and is not a reference to anything outside it.
 */
const CEL_COMPREHENSION_MACROS: ReadonlySet<string> = new Set(['all', 'exists', 'exists_one', 'map', 'filter']);

/** The parsed-AST node shape `parseCelToAst` hands back: an `op` and its `args`. */
interface CelNode {
  op: string;
  args: unknown;
}

function isCelNode(v: unknown): v is CelNode {
  return !!v && typeof v === 'object' && typeof (v as CelNode).op === 'string';
}

/**
 * The FREE root identifiers of a parsed predicate: every `id` node that is not
 * bound by an enclosing comprehension macro. `collectCelRootIdentifiers` reports
 * a macro's iteration variable as a root (`t` in `["a","b"].exists(t, t ==
 * note)`), which the runner then evaluates fine — so it was false-reported as
 * "not a field on this screen". Walked over the same canonical AST
 * (`parseCelToAst`), with the binding scoped to the macro's own arguments: an
 * outer bare `t` in `t == 1 && ["a"].exists(t, t == note)` is still a root.
 *
 * Shape read: `rcall` is a receiver-style call `[name, receiver, [args…]]`,
 * `call` a plain call `[name, [args…]]`, `.` a member access `[object, name]`;
 * every other op carries its operands in `args`. Strings inside `args` are
 * names, never identifiers, and are skipped.
 */
function collectFreeRoots(node: unknown, bound: ReadonlySet<string>, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectFreeRoots(n, bound, out);
    return;
  }
  if (!isCelNode(node)) return;
  if (node.op === 'id') {
    if (typeof node.args === 'string' && !bound.has(node.args)) out.add(node.args);
    return;
  }
  if (node.op === 'rcall' && Array.isArray(node.args)) {
    const [macro, receiver, rest] = node.args as [unknown, unknown, unknown];
    collectFreeRoots(receiver, bound, out);
    if (
      typeof macro === 'string' &&
      CEL_COMPREHENSION_MACROS.has(macro) &&
      Array.isArray(rest) &&
      isCelNode(rest[0]) &&
      rest[0].op === 'id' &&
      typeof rest[0].args === 'string'
    ) {
      const inner = new Set(bound);
      inner.add(rest[0].args);
      collectFreeRoots(rest.slice(1), inner, out);
      return;
    }
    collectFreeRoots(rest, bound, out);
    return;
  }
  collectFreeRoots(node.args, bound, out);
}

/**
 * The root identifiers a predicate references, comprehension variables
 * excluded. Falls back to `collectCelRootIdentifiers` — which reports them —
 * when the canonical parse hands back no AST, so an unexpected shape is never
 * read as "no roots".
 */
function predicateRoots(source: string): { ok: true; roots: string[] } | { ok: false; error: string } {
  const ast = parseCelToAst(source);
  if (ast) {
    const out = new Set<string>();
    collectFreeRoots(ast, new Set(), out);
    return { ok: true, roots: [...out] };
  }
  return collectCelRootIdentifiers(source);
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
 * roots against {@link screenPredicateRoots}. A root that is not a declared
 * field is named, with the nearest declared field when one is close
 * (`dicount` → `discount`). A predicate over a sibling field (`discount > 0`,
 * `record.discount > 0`) is fine; one over a name the renderer never binds — a
 * run variable such as `needsApproval`, the runtime's `vars` root — is not.
 */
export function screenVisibleWhenScopeError(visibleWhen: unknown, node: ScreenPreviewNode): string | undefined {
  if (visibleWhen === undefined || visibleWhen === null) return undefined;
  if (typeof visibleWhen === 'string' && !visibleWhen.trim()) return undefined;
  const shape = predicateSlotRefusal(visibleWhen);
  if (shape) return shape.message;
  const source = visibleWhen as string;
  const parsed = validateExpression('predicate', source);
  if (parsed.errors.length > 0) return parsed.errors.map((e) => e.message).join(' ');
  const collected = predicateRoots(source);
  if (!collected.ok) return collected.error;
  const roots = screenPredicateRoots(node);
  const undeclared = collected.roots.filter((r) => !roots.has(r));
  if (undeclared.length === 0) return undefined;
  const declared = screenFields(buildScreenSpec(node)).map((f) => f.name);
  return undeclared
    .map((r) => {
      const near = nearestName(r, declared);
      return `\`${r}\` is not a field on this screen${near ? ` (did you mean \`${near}\`?)` : ''}`;
    })
    .join('; ');
}

/** One field whose `visibleWhen` the screen renderer cannot evaluate, and why. */
export interface UnevaluableVisibleWhen {
  name: string;
  error: string;
}

/**
 * The authored field rows of a screen whose `visibleWhen` the screen renderer
 * cannot evaluate, with the reason — {@link screenVisibleWhenScopeError} per
 * row, by field name, so the Debug run's screen step can name them
 * (objectui#10743).
 */
export function unevaluableVisibleWhen(node: ScreenPreviewNode): UnevaluableVisibleWhen[] {
  const raw = (node.config as Record<string, unknown> | undefined)?.fields;
  if (!Array.isArray(raw)) return [];
  const out: UnevaluableVisibleWhen[] = [];
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    const error = screenVisibleWhenScopeError(row.visibleWhen, node);
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
