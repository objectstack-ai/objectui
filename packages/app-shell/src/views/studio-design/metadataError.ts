// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.
//
// Turn a publish response's per-draft failures into a FIELD-ANCHORED message.
// A publish carries per-draft failures in `data.failed[]`, each with its own
// spec-validation `issues`. This formatter heads each failed draft and lists
// its issues in the one issue-line grammar.
//
// The single-error reader (`formatMetadataError`) and that line grammar
// (`formatMetadataIssue`) moved to `@object-ui/data-objectstack` beside the
// `MetadataError.issues` they read (objectui#11302), so `plugin-designer`'s
// `MetadataFieldsPage` — which cannot import from app-shell — renders a refused
// save through the same reader. Callers import them from there directly.
//
// Below the publish formatter sits the strips' view of a refused save
// (`StudioRefusal`, objectui#11785): an author sentence, the input it is about,
// and that same reader's text behind a disclosure.

import {
  assertObjectMetadataWritable,
  CHOICE_TYPES_REQUIRING_OPTIONS,
  formatMetadataError,
  formatMetadataIssue,
  OBJECT_METADATA_TYPE,
  RELATIONSHIP_TYPES_REQUIRING_REFERENCE,
  type MetadataError,
  type MetadataValidationIssue,
} from '@object-ui/data-objectstack';
import type { NavTargetLabelResolver } from '@object-ui/layout';
import type { MetadataSelection } from '../metadata-admin/preview-registry.js';
import { t, tFormat, translateValidationMessage } from '../metadata-admin/i18n.js';
import { fieldsForNodeType, localizeFlowFields } from '../metadata-admin/inspectors/flow-node-config.js';
import { navEntryLabelText, type NavEntryLike } from '../metadata-admin/previews/navItemLabel.js';

/** A single failed draft from a publish response's `data.failed[]`. */
export interface PublishFailure {
  type: string;
  name: string;
  error: string;
  /** Machine code — `batch_aborted` marks a draft rolled back with the batch (ADR-0067 D2). */
  code?: string;
  issues?: MetadataValidationIssue[];
}

/**
 * framework 15.1+ (ADR-0067 D2): package publishes are ALL-OR-NOTHING. A
 * failed batch reports every draft in `failed[]` — the causal item with its
 * real error, the rest with this code — and `publishedCount: 0`.
 */
export const BATCH_ABORTED_CODE = 'batch_aborted';

/**
 * Format the `failed[]` from a publish response (the server returns 200 with
 * the drafts that didn't go live).
 *
 * Two server generations produce two shapes (both handled):
 * - **15.1+ all-or-nothing** (ADR-0067 D2): the batch rolled back atomically —
 *   render ONE rolled-back banner anchored on the causal item(s), not N
 *   parallel errors (`batch_aborted` entries are consequences, not causes).
 * - **pre-15.1 partial publish**: each failed draft gets a heading and, when
 *   the failure was a validation error, its field-anchored issues indented
 *   below.
 */
export function formatPublishFailures(failed: PublishFailure[]): string {
  const line = (f: PublishFailure): string => {
    const head = `${f.type}/${f.name}: ${f.error}`;
    const issues = Array.isArray(f.issues) ? f.issues : [];
    return [head, ...issues.map((i) => `  ${formatMetadataIssue(i)}`)].join('\n');
  };
  const aborted = failed.filter((f) => f.code === BATCH_ABORTED_CODE);
  if (aborted.length > 0) {
    const causal = failed.filter((f) => f.code !== BATCH_ABORTED_CODE);
    return [
      'Nothing was published — the batch rolled back (all-or-nothing).',
      ...(causal.length > 0 ? causal.map(line) : aborted.slice(0, 1).map(line)),
      `(${aborted.length} other draft${aborted.length === 1 ? '' : 's'} aborted with it — fix the cause and publish again.)`,
    ].join('\n');
  }
  return failed.map(line).join('\n');
}

// ---------------------------------------------------------------------------
// objectui#11785 — a refusal the author can act on.
//
// Studio's strips used to print `formatMetadataError(e)` verbatim: the object
// write guard's prose, and the server's issue lines with raw paths such as
// `nodes.2.config.title`. Each strip now shows a `StudioRefusal`: one sentence
// in the designer's own words, naming the input it is about in the terms the
// editor shows (a field's label, a step's label and its inspector input, a
// navigation item), the selection that opens that input, and the raw text
// behind a "Details" disclosure.
//
// ⛔ `formatMetadataError` is not changed. It is the one reader of a failed save
// for every other surface, and its text is exactly what Details holds here, so
// nothing the strip printed before is lost: a path this module cannot place on
// the open editor keeps its line under Details, and the sentence says so.
//
// Everything here reads the body the save SENT, never the editor's buffer: an
// issue path indexes the document the server received, and the Interfaces nav
// save sends fewer entries than the editor holds (objectui#11776), so the same
// index can name a different entry in each.
// ---------------------------------------------------------------------------

/** One save failure as a Studio strip shows it (objectui#11785). */
export interface StudioRefusal {
  /** The sentence the strip shows. */
  message: string;
  /** The selection that opens the input the refusal is about, when the open editor has it. */
  target?: MetadataSelection;
  /**
   * The raw refusal, behind the disclosure: `formatMetadataError`'s text, what
   * the strip printed before. Absent when `message` already is that text.
   */
  detail?: string;
}

/** Where an issue's input sits on the open editor. */
export interface LocatedInput {
  /** The author's words for the input, e.g. `the field “Status”`. */
  where: string;
  selection: MetadataSelection;
}

/** Places one issue path, split on `.`, on the body that was sent; `null` when it cannot. */
export type IssueLocator = (path: readonly string[]) => LocatedInput | null;

type SentBody = Record<string, unknown>;

function isSentBody(value: unknown): value is SentBody {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** The declared `MetadataError.issues`, or none. */
function issuesOf(e: unknown): MetadataValidationIssue[] {
  const issues = (e as Partial<MetadataError> | null | undefined)?.issues;
  return Array.isArray(issues) ? issues : [];
}

/** A failure with nothing to rewrite (a read, a transport failure): shown as it was. */
export function plainRefusal(e: unknown): StudioRefusal {
  return { message: formatMetadataError(e) };
}

/**
 * A server refusal that carries issues: the first issue a locator can place
 * becomes the sentence and the target; every issue stays in Details. With no
 * issues the failure is shown as it was ({@link plainRefusal}).
 */
export function issueRefusal(e: unknown, locale: string, locate?: IssueLocator): StudioRefusal {
  const detail = formatMetadataError(e);
  const issues = issuesOf(e);
  if (issues.length === 0) return { message: detail };
  for (const issue of issues) {
    const path = String(issue.path ?? '').split('.').filter((seg) => seg !== '');
    const at = locate?.(path);
    if (!at) continue;
    const sentence = tFormat('engine.studio.refusal.issue', locale, {
      where: at.where,
      problem: translateValidationMessage(issue.message, locale),
    });
    const more = issues.length - 1;
    return {
      message: more > 0 ? `${sentence} ${tFormat('engine.studio.refusal.more', locale, { count: more })}` : sentence,
      target: at.selection,
      detail,
    };
  }
  return { message: t('engine.studio.refusal.unlocated', locale), detail };
}

/** A field's label as the editor shows it, its API name when it has none. */
function fieldLabelOf(name: string, def: SentBody): string {
  return typeof def.label === 'string' && def.label.trim() !== '' ? def.label.trim() : name;
}

/**
 * The fields of an object body in the order and under the names the write
 * guard reads them (`fieldEntries` in `object-metadata-write-guard.ts`): a
 * record's keys, or an array entry's `name` (`[index]` without one). `named`
 * says whether the editor can select it.
 */
function guardFieldEntries(fields: unknown): Array<{ name: string; def: SentBody; named: boolean }> {
  if (Array.isArray(fields)) {
    return fields.flatMap((raw, index) => {
      if (!isSentBody(raw)) return [];
      const named = typeof raw.name === 'string' && raw.name !== '';
      return [{ name: named ? (raw.name as string) : `[${index}]`, def: raw, named }];
    });
  }
  if (isSentBody(fields)) {
    return Object.entries(fields).flatMap(([name, def]) => (isSentBody(def) ? [{ name, def, named: true }] : []));
  }
  return [];
}

const GUARD_PROBE = 'studio-refusal-probe';

/** The message the write guard throws for `body`, or `null` when it lets it through. */
function guardMessageFor(body: SentBody): string | null {
  try {
    assertObjectMetadataWritable(OBJECT_METADATA_TYPE, body, GUARD_PROBE);
    return null;
  } catch (probe) {
    return probe instanceof Error ? probe.message : String(probe);
  }
}

/**
 * The object write guard's refusal of `sent`, in the author's words, or `null`
 * when `e` is not that refusal.
 *
 * Told apart without reading the prose: the guard throws before any request, so
 * its error carries no status and no issues, and its message is a function of
 * the body alone (it names no door). So the guard is run again on the body that
 * was sent; `e` is its refusal only if the two messages are identical, and the
 * field is the first one the guard refuses on its own, by the same equality.
 * Anything else falls through, and the strip shows the failure as it was.
 */
function guardRefusalOf(e: unknown, sent: SentBody, locale: string): StudioRefusal | null {
  if (!(e instanceof Error)) return null;
  if ((e as Partial<MetadataError>).status !== undefined || issuesOf(e).length > 0) return null;
  if (guardMessageFor(sent) !== e.message) return null;
  for (const { name, def, named } of guardFieldEntries(sent.fields)) {
    const own = guardMessageFor({ fields: { [name]: def } });
    if (own === null) continue;
    if (own !== e.message || !named) return null;
    const type = String(def.type);
    const key = CHOICE_TYPES_REQUIRING_OPTIONS.includes(type)
      ? 'engine.studio.refusal.choiceWithoutOptions'
      : RELATIONSHIP_TYPES_REQUIRING_REFERENCE.includes(type)
        ? 'engine.studio.refusal.relationshipWithoutTarget'
        : null;
    if (!key) return null;
    return {
      message: tFormat(key, locale, { field: fieldLabelOf(name, def) }),
      target: { kind: 'field', id: name },
      detail: e.message,
    };
  }
  return null;
}

/**
 * Data pillar: `fields.NAME…` on the object body that was sent (a record keyed
 * by name, or an array addressed by index or by `name`), placed on that field.
 */
export function objectFieldLocator(sent: SentBody, locale: string): IssueLocator {
  return (path) => {
    if (path[0] !== 'fields' || path.length < 2) return null;
    const key = path[1];
    const fields = sent.fields;
    let name: string | null = null;
    let def: SentBody | null = null;
    if (Array.isArray(fields)) {
      const raw = /^\d+$/.test(key) ? fields[Number(key)] : fields.find((f) => isSentBody(f) && f.name === key);
      if (isSentBody(raw) && typeof raw.name === 'string' && raw.name !== '') {
        name = raw.name;
        def = raw;
      }
    } else if (isSentBody(fields) && isSentBody(fields[key])) {
      name = key;
      def = fields[key] as SentBody;
    }
    if (name === null || def === null) return null;
    return {
      where: tFormat('engine.studio.refusal.field', locale, { field: fieldLabelOf(name, def) }),
      selection: { kind: 'field', id: name },
    };
  };
}

/** A refused save of an object body, as the Data pillar's strip shows it. */
export function objectSaveRefusal(e: unknown, sent: SentBody, locale: string): StudioRefusal {
  return guardRefusalOf(e, sent, locale) ?? issueRefusal(e, locale, objectFieldLocator(sent, locale));
}

/**
 * The inspector label of the input a node path below the node names, e.g.
 * `['config', 'title']` on a `notify` node → its Title. The node's field table
 * is the one the inspector renders offline; the longest declared path that the
 * issue path starts with wins.
 */
function flowInputLabel(type: unknown, rest: readonly string[], locale: string): string | null {
  if (typeof type !== 'string' || rest.length === 0) return null;
  let best: { label: string; depth: number } | null = null;
  for (const field of localizeFlowFields(type, fieldsForNodeType(type), locale)) {
    const depth = field.path.length;
    if (depth > rest.length || !field.path.every((seg, i) => seg === rest[i])) continue;
    if (!best || depth > best.depth) best = { label: field.label, depth };
  }
  return best ? best.label : null;
}

/**
 * Automations pillar: `nodes.INDEX…` on the flow body that was sent, placed on
 * that node (the step), and on its inspector input when the node's table
 * declares one at the rest of the path.
 */
export function flowNodeLocator(sent: SentBody, locale: string): IssueLocator {
  return (path) => {
    if (path[0] !== 'nodes' || !/^\d+$/.test(path[1] ?? '')) return null;
    const node = Array.isArray(sent.nodes) ? sent.nodes[Number(path[1])] : undefined;
    if (!isSentBody(node) || typeof node.id !== 'string' || node.id === '') return null;
    const step = typeof node.label === 'string' && node.label.trim() !== '' ? node.label.trim() : node.id;
    const input = flowInputLabel(node.type, path.slice(2), locale);
    return {
      where: input
        ? tFormat('engine.studio.refusal.stepInput', locale, { input, step })
        : tFormat('engine.studio.refusal.step', locale, { step }),
      selection: { kind: 'node', id: node.id },
    };
  };
}

/** A refused save of a flow body, as the Automations pillar's strip shows it. */
export function flowSaveRefusal(e: unknown, sent: SentBody, locale: string): StudioRefusal {
  return issueRefusal(e, locale, flowNodeLocator(sent, locale));
}

/** The nav inspector's own label for a top-level entry key it edits. */
const NAV_INPUT_KEYS: Readonly<Record<string, string>> = {
  label: 'engine.studio.nav.label',
  objectName: 'engine.studio.nav.linkObject',
};

/**
 * Interfaces pillar nav: `navigation.INDEX…` on the navigation that was SENT,
 * mapped back to the editor's entry of the same object or `id` (the save sends
 * the editor's entries less the unbound ones, objectui#11776), and placed on it
 * with the nav selection the editor uses (`navigation[i]`). Only top-level
 * entries: the Studio nav inspector edits no nested entry, so a `children`
 * path stays under Details.
 */
export function navEntryLocator(opts: {
  sent: readonly unknown[];
  editor: readonly unknown[];
  locale: string;
  targetLabel?: NavTargetLabelResolver;
}): IssueLocator {
  const { sent, editor, locale, targetLabel } = opts;
  return (path) => {
    if (path[0] !== 'navigation' || !/^\d+$/.test(path[1] ?? '') || path[2] === 'children') return null;
    const entry = sent[Number(path[1])];
    if (!isSentBody(entry)) return null;
    const index = editor.findIndex(
      (e) => e === entry || (isSentBody(e) && typeof e.id === 'string' && e.id !== '' && e.id === entry.id),
    );
    if (index < 0) return null;
    const own = editor[index] as NavEntryLike;
    const item = navEntryLabelText(own, locale, targetLabel) || String(own.id ?? '');
    const inputKey = path[2] !== undefined ? NAV_INPUT_KEYS[path[2]] : undefined;
    return {
      where: inputKey
        ? tFormat('engine.studio.refusal.navItemInput', locale, { input: t(inputKey, locale), item })
        : tFormat('engine.studio.refusal.navItem', locale, { item }),
      selection: { kind: 'nav', id: `navigation[${index}]` },
    };
  };
}
