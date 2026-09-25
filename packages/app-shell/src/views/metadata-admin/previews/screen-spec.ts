// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * screen-spec — pure helpers that map a flow `screen` node's authored `config`
 * onto the runtime `ScreenSpec` (the contract {@link ScreenView} renders), plus
 * `{var}` interpolation for the title/description and `visibleWhen` field
 * gating. Kept framework-free so {@link ScreenPreview} stays a thin component
 * and these stay unit-testable.
 */

import type { ScreenSpec, ScreenFieldSpec } from '../../ScreenView.js';
import { evalVisibleWhen } from './simulator/flow-sim-validate.js';

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

/** What the preview made of one field's `visibleWhen` (see {@link fieldVisibility}). */
export interface FieldVisibility {
  visible: boolean;
  /** Set when the predicate is refused or fails to evaluate; the field is then hidden. */
  error?: string;
}

/**
 * A field's `visibleWhen` gate, evaluated against `variables` with the
 * simulator's one CEL call, the one its edge guards use (`evalVisibleWhen` in
 * `./simulator/flow-sim-validate.ts`, objectui#10692): the runtime's
 * `@objectstack/formula` engine over the runtime's flow scope (bare names,
 * `vars.*`, `record.*`).
 *
 * - No predicate (absent or blank), or no `variables` at all: visible.
 * - A predicate that evaluates: visible when the value is truthy.
 * - A predicate that is refused or faults — a `{var}` brace (the brace trap
 *   `registerFlow` refuses in this bare-CEL slot), a non-string, a CEL error
 *   such as a variable not in `variables` — is read as HIDDEN, and the error
 *   is returned. That is the runtime's reading: when a screen is resumed,
 *   `refuseInvalidScreenInput` reports a `visibleWhen` it cannot evaluate and
 *   `validateScreenInputs` treats the field as hidden. A flow `registerFlow`
 *   refuses never runs, so its field is never shown either.
 */
export function fieldVisibility(visibleWhen: unknown, variables: Record<string, unknown> | undefined): FieldVisibility {
  if (!variables) return { visible: true };
  const g = evalVisibleWhen(visibleWhen, variables);
  if (g.kind === 'absent') return { visible: true };
  if (g.kind === 'fault') return { visible: false, error: g.error };
  return { visible: g.result };
}

/** Whether a field is shown: {@link fieldVisibility}'s `visible`. */
export function isFieldVisibleWhen(visibleWhen: unknown, variables: Record<string, unknown> | undefined): boolean {
  return fieldVisibility(visibleWhen, variables).visible;
}

/**
 * The authored field rows of a screen whose `visibleWhen` is refused or fails
 * to evaluate against `variables`, with the error. Each is hidden (see
 * {@link fieldVisibility}); the Debug run names them on the screen's step.
 */
export function unevaluableVisibleWhen(
  node: ScreenPreviewNode,
  variables: Record<string, unknown> | undefined,
): Array<{ name: string; error: string }> {
  const raw = (node.config as Record<string, unknown> | undefined)?.fields;
  if (!Array.isArray(raw)) return [];
  const out: Array<{ name: string; error: string }> = [];
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    const { error } = fieldVisibility(row.visibleWhen, variables);
    if (error) out.push({ name: row.name, error });
  }
  return out;
}

/**
 * Coerce the authored `config.fields` rows into runtime `ScreenFieldSpec`s,
 * dropping any that {@link fieldVisibility} reads as hidden against
 * `variables`. (The runtime `screen` executor sends `visibleWhen` to the
 * client raw; this preview decides it up front, with the runtime's reading.)
 */
function toScreenFields(raw: unknown, variables: Record<string, unknown> | undefined): ScreenFieldSpec[] {
  if (!Array.isArray(raw)) return [];
  const out: ScreenFieldSpec[] = [];
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    if (!isFieldVisibleWhen(row.visibleWhen, variables)) continue;
    out.push({
      name: row.name,
      label: typeof row.label === 'string' ? row.label : undefined,
      type: typeof row.type === 'string' ? row.type : undefined,
      required: row.required === true,
    });
  }
  return out;
}

/** Count of authored field rows hidden by their `visibleWhen` against `variables`. */
export function hiddenFieldCount(node: ScreenPreviewNode, variables: Record<string, unknown> | undefined): number {
  const raw = (node.config as Record<string, unknown> | undefined)?.fields;
  if (!Array.isArray(raw)) return 0;
  let hidden = 0;
  for (const f of raw) {
    if (!f || typeof f !== 'object') continue;
    const row = f as Record<string, unknown>;
    if (typeof row.name !== 'string' || !row.name) continue;
    if (!isFieldVisibleWhen(row.visibleWhen, variables)) hidden++;
  }
  return hidden;
}

/**
 * Map a screen node's authored `config` onto the runtime `ScreenSpec` — the
 * same keys the engine's `screen` executor reads (title / description / fields
 * / objectName / mode / defaults / idVariable). `fields` are gated by their
 * `visibleWhen` against `variables` (omit `variables` to keep every field).
 */
/**
 * A designed screen always carries a (possibly empty) field list — `fields` is
 * optional on the WIRE type only, where a message-only / object-form pause may
 * omit it.
 */
export type DesignedScreenSpec = ScreenSpec & { fields: ScreenFieldSpec[] };

export function buildScreenSpec(node: ScreenPreviewNode, variables?: Record<string, unknown>): DesignedScreenSpec {
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
    fields: toScreenFields(c.fields, variables),
    kind: objectName ? 'object-form' : 'fields',
    objectName,
    mode,
    defaults,
    idVariable: typeof c.idVariable === 'string' ? c.idVariable : undefined,
  };
}
