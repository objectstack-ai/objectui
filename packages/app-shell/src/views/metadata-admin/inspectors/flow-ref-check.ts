// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * flow-ref-check — pure, scope-aware "unknown reference" detection for the flow
 * inspector's inline validation (#1934 follow-up). Pairs the data-picker with a
 * gentle warning when an authored expression / template references a name that
 * is NOT in scope at the node — catching typos (`recrod.email`) and stale
 * references the picker would have prevented.
 *
 * Deliberately conservative — a warning that cries wolf is worse than none:
 *   • Only the ROOT of a reference path is checked (`record.email` → `record`),
 *     so a field list is never needed; if `record` is in scope the whole path is
 *     accepted.
 *   • Function / macro calls (`daysFromNow(90)`, `has(...)`, `size(...)`) are
 *     skipped — an identifier immediately followed by `(` is never a reference.
 *   • A CEL comprehension macro's iteration variable (`r` in
 *     `rows.map(r, r.subject)`) is bound inside that macro's argument list only;
 *     the same name anywhere else is a root like any other (objectui#10538).
 *   • String-literal contents are stripped before scanning.
 *   • Runtime globals the engine injects (`env`, `$error`, `data`, …) and CEL
 *     keywords/literals are allow-listed.
 *   • For templates only the inside of single-brace `{…}` holes is scanned.
 *
 * The caller supplies the in-scope ROOT names (see {@link scopeRoots}); an empty
 * set means "scope unknown" and the check is skipped (returns nothing).
 */

import type { ExprFieldRole } from './expression-validate.js';
import type { ScopeRef } from './flow-scope.js';
import { tFormat } from '../i18n.js';

/** CEL keywords / literals that are never flow references. */
const CEL_RESERVED = new Set(['true', 'false', 'null', 'in']);
/**
 * Roots the engine provides at runtime that won't show up in the graph-resolved
 * scope. Conservative allow-list — better to miss a typo than flag a valid ref.
 */
const RUNTIME_GLOBALS = new Set(['env', 'request', 'context', 'user', 'now', 'today', 'self', 'data']);

export interface UnknownRef {
  /** The unresolved root identifier, as authored. */
  token: string;
  /** Nearest in-scope root within edit distance 2, when one exists (typo hint). */
  suggestion?: string;
}

/** The set of valid root identifiers from a resolved scope's refs. */
export function scopeRoots(refs: ReadonlyArray<ScopeRef>): Set<string> {
  const roots = new Set<string>();
  for (const r of refs) {
    const root = r.token.split('.')[0];
    if (root) roots.add(root);
  }
  return roots;
}

/** Bounded Levenshtein distance, giving up (returns max+1) once it exceeds `max`. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
      if (prev[j] < rowMin) rowMin = prev[j];
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length];
}

/**
 * CEL's comprehension macros. Each is receiver-style (`rows.map(r, r.subject)`,
 * `rows.map(r, r.ok, r.subject)`), and its first argument DECLARES the iteration
 * variable instead of reading one.
 */
const COMPREHENSION_MACROS = new Set(['map', 'filter', 'exists', 'all', 'exists_one']);

/** One macro-bound iteration variable and the argument-list span it is bound in. */
interface MacroBinding {
  name: string;
  /** Index of the macro call's `(`. */
  open: number;
  /** Index of the matching `)`, or the source length while it is still unclosed. */
  close: number;
}

/**
 * The iteration variables the comprehension macros in `src` bind, each with the
 * span of its own macro's argument list. Scope is lexical: the variable is bound
 * between that `(` and its matching `)` and nowhere else, so the receiver and
 * anything after the closing `)` still read it as a root. `src` must already
 * have its string literals stripped, so a `)` inside a string cannot close a span.
 */
function macroBindings(src: string): MacroBinding[] {
  const out: MacroBinding[] = [];
  // `.macro(v,` — a member call whose first argument is a bare identifier.
  const re = /\.\s*([A-Za-z_]\w*)\s*\(\s*([A-Za-z_]\w*)\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (!COMPREHENSION_MACROS.has(m[1])) continue;
    const open = src.indexOf('(', m.index);
    let close = src.length;
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')' && --depth === 0) {
        close = i;
        break;
      }
    }
    out.push({ name: m[2], open, close });
  }
  return out;
}

/** Extract reference-position root identifiers (skipping members, calls and macro-bound variables). */
function rootIdentifiers(src: string): string[] {
  // Strip string literals so their contents aren't scanned as references.
  const noStrings = src
    .replace(/'(?:[^'\\]|\\.)*'/g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"/g, ' ');
  const bindings = macroBindings(noStrings);
  const out: string[] = [];
  // Lookbehind keeps this to ROOTS: an identifier not preceded by `.` (member),
  // a word char, or `$`. Zero-width, so adjacent tokens are never swallowed.
  const re = /(?<![.\w$])([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noStrings))) {
    const name = m[1];
    const at = m.index;
    // A trailing `(` (after optional spaces) marks a function / macro call.
    if (/^\s*\(/.test(noStrings.slice(at + name.length))) continue;
    if (CEL_RESERVED.has(name)) continue;
    // Inside its own macro's argument list (the declaration included), the
    // iteration variable is bound, not a reference to a flow variable.
    if (bindings.some((b) => b.name === name && at > b.open && at < b.close)) continue;
    out.push(name);
  }
  return out;
}

/**
 * Find referenced roots that are not in scope. Returns [] when clean, when the
 * source is empty, or when `knownRoots` is empty (scope unknown → don't guess).
 */
export function findUnknownRefs(source: unknown, role: ExprFieldRole, knownRoots: Set<string>): UnknownRef[] {
  let raw = '';
  if (typeof source === 'string') raw = source;
  else if (source && typeof source === 'object') raw = String((source as { source?: string }).source ?? '');
  if (!raw.trim() || knownRoots.size === 0) return [];

  let scan = raw;
  if (role === 'template') {
    const holes = raw.match(/\{([^{}]+)\}/g);
    if (!holes) return [];
    scan = holes.map((h) => h.slice(1, -1)).join(' ; ');
  }

  const seen = new Set<string>();
  const unknown: UnknownRef[] = [];
  for (const root of rootIdentifiers(scan)) {
    if (seen.has(root)) continue;
    seen.add(root);
    if (knownRoots.has(root) || RUNTIME_GLOBALS.has(root) || root.startsWith('$')) continue;
    let suggestion: string | undefined;
    let best = 3;
    for (const k of knownRoots) {
      const d = editDistance(root, k, 2);
      if (d < best) {
        best = d;
        suggestion = k;
      }
    }
    unknown.push({ token: root, suggestion: best <= 2 ? suggestion : undefined });
  }
  return unknown;
}

/** Build a one-line inspector warning from unknown refs (shared by the field
 *  and edge inspectors). Localized; English (no locale) is the fallback. */
export function describeUnknownRefs(unknown: ReadonlyArray<UnknownRef>, locale?: string): string {
  if (unknown.length === 1) {
    const u = unknown[0];
    return u.suggestion
      ? tFormat('engine.flowRef.unknownWithSuggestion', locale, { token: u.token, suggestion: u.suggestion })
      : tFormat('engine.flowRef.notInScope', locale, { token: u.token });
  }
  return tFormat('engine.flowRef.notInScopeMulti', locale, { tokens: unknown.map((u) => `\`${u.token}\``).join(', ') });
}
