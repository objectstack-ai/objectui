/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#7779 — `ObjectViewSchema`'s ten unmirrored declared keys, closed
 * nine-for-ten under maintainer ruling B (2026-09-06: liveness first, then
 * mirror-or-retire per key), with `listViews` left in the parity ledger by
 * measurement.
 *
 * ## The defect
 *
 * `ObjectViewSchema` in `../objectql.ts` declared ten keys its Zod mirror in
 * `../zod/objectql.zod.ts` never did (objectui#7279's `UnmirroredDeclared`
 * reading). `BaseSchema` is `.passthrough()`, so a document authoring any of
 * them passed the validator UNEXAMINED while the published type invited the
 * author to write it: `defaultViewType: 'tree'`, `navigation: 'page'`,
 * `searchableFields: 'name'` all parsed green and rendered with the key
 * ignored — declared, not enforced.
 *
 * ## What this file pins, and the shapes it borrows
 *
 * The mirror half is `object-kanban-group-by-limit-7322.test.ts`: membership is
 * asserted on the mirror's OWN `.shape`, never on parse acceptance (under
 * `.passthrough()` acceptance cannot tell "declared" from "admitted
 * unexamined"); every mirrored key carries an accepted-and-survives assertion
 * AND a wrong-typed refusal AT the key — the pairing that makes the pin a
 * reading rather than a tolerance; and the read set is DERIVED off the renderer
 * with a positive control, so a zero is a reading.
 *
 * The by-reference half is `spec-subschema-parity.test.ts`: the three spec keys
 * are pinned by IDENTITY against the spec slot (`SpecListViewSchema.shape.*`),
 * not against a copy, so a spec-side change moves them; the two view-switcher
 * keys the same way against the sibling `ViewSwitcherSchema` slots the renderer
 * forwards them into verbatim.
 *
 * The retire half is `TimelineSchema.timeScale` (objectui#6355) /
 * `ObjectKanbanSchema.groupField` (objectui#7322): `?: never` on the TS face and
 * `retirementTombstone()` on the mirror, BOTH halves, so the retired spelling is
 * refused BY NAME on each face rather than deleted into the index signature.
 *
 * ## The one that stayed, and why it is pinned too
 *
 * `listViews` is NOT mirrored. The ruling's own fallback clause fires on the
 * measurement below: the declaration's value is the local `NamedListView` — 64
 * declared top-level members, of which the renderer reads 21, leaving 43 that a
 * key-for-key local mirror would enforce unread.
 *
 * ⚠️ BOTH FIGURES WERE RE-TAKEN at objectui#8980 and are NOT the ones this file
 * was written with. It measured 47 declared / 6 read / 41 unread, plus a
 * SEVENTH read, `data`, that was declared nowhere and reached the renderer
 * through an `as any` cast — which is why the read set had seven entries while
 * the arithmetic subtracted only six. The director-seat ruling of 2026-09-13
 * (objectui#8980) declared the seventeen members the protocol declares on this
 * surface and objectui did not, `data` among them with the cast removed, and
 * wired a read point for each. So the read set and the declared set no longer
 * disagree on a single name, and the arithmetic subtracts the whole read set.
 * ⛔ Do not quote 47 / 6 / 41 from anywhere: they are this file's history, not
 * its reading. The spec's
 * `ViewSchema.listViews` is a record of the STRICT `ObjectListViewSchema`, and
 * the spec value refuses the named views this package's docs teach. Both facts
 * are asserted against the SPEC schema here, so the day the spec relaxes (or
 * the renderer's read set moves) the measurement — and the stop — is re-taken
 * rather than remembered.
 *
 * ## objectui#7924 — the same measurement, now PER MEMBER
 *
 * The two figures above were a COUNT and a name list. objectui#7924 asks which
 * members, by name, are on each side, because that is the input the `listViews`
 * value-type ruling (objectui#7928) needs: tombstoning the unread ones narrows a
 * published accept set, and making the renderer read them is capability growth.
 * ⛔ Neither is dispatched or decided here — this file only measures.
 *
 * The census lives in the last describe block and changes the INSTRUMENT as well
 * as the resolution:
 *
 * - the declared set is walked with the TypeScript parser (`ts.createSourceFile`,
 *   the interface's own `PropertySignature` members), ⛔ not a regex and ⛔ not a
 *   brace-depth count — a brace parser on this repo has already failed to
 *   terminate at an object's close (objectui#8071). The two regexes are kept and
 *   asserted AGAINST the parser, so the instrument swap is itself a reading:
 *   strict regex 47 = parser 47, loose regex 59.
 * - the read set is derived by walking every route from `schema.listViews` to a
 *   named view, and every occurrence of that record is CLASSIFIED — so a new
 *   route fails as `UNCLASSIFIED` instead of silently shrinking the read set.
 *   That found a named-view read the old `currentNamedViewConfig?.KEY` regex
 *   cannot see: `{view.label || key}` on the tab strip.
 * - each of the 47 members is then pinned BY NAME on its side of the partition,
 *   so a member moving between read and unread fails in EITHER direction.
 *
 * ⚠️ The distinction the whole finding turns on: a member reached through
 * `activeView?.KEY` — the host's `views` prop — is NOT read off the named view.
 * `rowHeight: activeView?.rowHeight` is the pinned counter-control below.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import {
  ListViewSchema as SpecListViewSchema,
  ObjectListViewSchema as SpecObjectListViewSchema,
  NavigationConfigSchema as SpecNavigationConfigSchema,
  ViewSchema as SpecViewSchema,
} from '@objectstack/spec/ui';

import { ObjectViewSchema } from '../zod/objectql.zod';
import { stripImportedDefaults } from '../zod/imported-defaults.js';
import { ViewSwitcherSchema } from '../zod/views.zod';
import { safeValidateSchema } from '../zod/index.zod';
import type { ObjectViewSchema as TsObjectViewSchema, NamedListView } from '../objectql';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
/** The `object-view` NODE renderer — registered by `plugin-view/src/index.tsx`. */
const READER = 'packages/plugin-view/src/ObjectView.tsx';
/** The switcher the renderer composes; it reads the two forwarded keys. */
const SWITCHER = 'packages/plugin-view/src/ViewSwitcher.tsx';
const REGISTRATION = 'packages/plugin-view/src/index.tsx';
const MIRROR = 'packages/types/src/zod/objectql.zod.ts';
const DECLARATION = 'packages/types/src/objectql.ts';
const README = 'packages/plugin-view/README.md';
const DOC = 'content/docs/plugins/plugin-view.mdx';

const SPEC_REFERENCED = ['navigation', 'searchableFields', 'filterableFields'] as const;
const SIBLING_REFERENCED = ['allowCreateView', 'viewActions'] as const;
const LOCAL_LITERALS = ['defaultViewType', 'defaultListView', 'showViewSwitcher'] as const;
const MIRRORED = [...SPEC_REFERENCED, ...SIBLING_REFERENCED, ...LOCAL_LITERALS] as const;
type Mirrored = (typeof MIRRORED)[number];
const RETIRED = 'viewTabBar';
const LEDGERED = 'listViews';

/**
 * Exact source text of the reads, as they stand today. Line numbers drift and
 * live in the docblocks' prose only; the READ is the fact.
 */
const READ_TEXT: Record<Mirrored, ReadonlyArray<readonly [file: string, text: string]>> = {
  navigation: [[READER, 'const navigationConfig: ViewNavigationConfig | undefined = schema.navigation;']],
  searchableFields: [[READER, 'searchableFields: activeView?.searchableFields ?? (schema as any).searchableFields,']],
  filterableFields: [[READER, 'filterableFields: activeView?.filterableFields ?? (schema as any).filterableFields,']],
  allowCreateView: [
    [READER, 'allowCreateView: schema.allowCreateView,'],
    [SWITCHER, 'const createViewButton = schema.allowCreateView ? ('],
  ],
  viewActions: [
    [READER, 'viewActions: schema.viewActions,'],
    [SWITCHER, '{schema.viewActions.map((action, idx) => {'],
  ],
  defaultViewType: [[READER, "return schema.defaultViewType || 'grid';"]],
  defaultListView: [[READER, 'if (schema.defaultListView && namedListViews?.[schema.defaultListView]) {']],
  showViewSwitcher: [[READER, 'const showViewSwitcherToggle = schema.showViewSwitcher === true;']],
};

/** The registration's editable-props meta names the three local literals too. */
const REGISTRATION_TEXT: readonly string[] = [
  "{ name: 'defaultViewType', type: 'enum', enum: ['grid', 'kanban', 'gallery', 'calendar', 'timeline', 'gantt', 'map'] },",
  "{ name: 'defaultListView', type: 'string' },",
  "{ name: 'showViewSwitcher', type: 'boolean' },",
];

/** A declared-keys-only control of the read set: read, declared, untouched. */
const READ_CONTROL_KEY = 'objectName';
/**
 * A plausible view-chrome spelling the renderer never reads. It stays undeclared
 * on both faces — the proof that this change declares the keys the card measured
 * and nothing else.
 */
const CONTROL_KEY = 'viewSwitcherPosition';

/**
 * The `NamedListView` members the renderer reads off a named view. Twenty-one
 * since objectui#8980 wired a read point for each of the seventeen protocol
 * members it declares; seven before it, of which `data` was the undeclared cast.
 */
const NAMED_VIEW_READS = [
  'appearance', 'calendar', 'chart', 'columns', 'data', 'fieldOrder', 'filter', 'gallery',
  'gantt', 'grouping', 'kanban', 'label', 'map', 'name', 'options', 'rowColor', 'sort',
  'timeline', 'tree', 'type', 'userActions',
] as const;

/* ── objectui#7924 — the per-member liveness census ───────────────────────────
 * Both halves below are RE-DERIVED at test time (`namedListViewMembers()` /
 * `deriveNamedViewReads()`); the literals are the pinned READING, so a member
 * that moves between the two sets — in EITHER direction — fails by name.
 */

/** Every top-level member `NamedListView` declares. 64 today (47 + objectui#8980's seventeen), sorted. */
const NAMED_LIST_VIEW_DECLARED = [
  'addDeleteRecordsInline', 'addRecord', 'addRecordViaForm', 'allowExport', 'allowPrinting',
  'appearance', 'aria', 'bulkActionDefs', 'bulkActions', 'calendar', 'chart',
  'clickIntoRecordDetails', 'collapseAllByDefault', 'color', 'columns', 'compactToolbar',
  'conditionalFormatting', 'data', 'densityMode', 'description', 'emptyState', 'exportOptions',
  'fieldOrder', 'fieldTextColor', 'filter', 'filterableFields', 'gallery', 'gantt', 'grouping',
  'hiddenFields', 'inlineEdit', 'kanban', 'label', 'map', 'name', 'navigation', 'options',
  'pageName', 'pagination', 'prefixField', 'resizable', 'rowActions', 'rowColor', 'rowHeight',
  'searchableFields', 'selection', 'sharing', 'showColor', 'showDensity', 'showDescription',
  'showFilters', 'showGroup', 'showHideFields', 'showRecordCount', 'showSearch', 'showSort',
  'sort', 'tabs', 'timeline', 'tree', 'type', 'userActions', 'userFilters', 'wrapHeaders',
] as const;

/**
 * The DECLARED members the renderer reads off a named view. All 21 of them
 * since objectui#8980 — the read set and the declared set no longer disagree on
 * a single name, which is what closed {@link NAMED_VIEW_READ_UNDECLARED}.
 */
const NAMED_VIEW_READ_DECLARED = [
  'appearance', 'calendar', 'chart', 'columns', 'data', 'fieldOrder', 'filter', 'gallery',
  'gantt', 'grouping', 'kanban', 'label', 'map', 'name', 'options', 'rowColor', 'sort',
  'timeline', 'tree', 'type', 'userActions',
] as const;

/**
 * Read off a named view but NOT declared on `NamedListView`. EMPTY since
 * objectui#8980, and the emptiness is the reading.
 *
 * This held exactly one name, `data`, reached through an `as any` cast on the
 * named-view config — objectui#7928's open half. The director-seat ruling of
 * 2026-09-13 answered it by name ("`data` replaces the `as any` read …: declare
 * it"), so the member is declared, the cast is gone, and the census arithmetic
 * now subtracts the whole read set rather than the read set minus one.
 *
 * ⛔ A name reappearing here is not a test to update: it is a renderer reading a
 * key off a named view that nothing declares, which is the class objectui#7928
 * sends to a ruling.
 */
const NAMED_VIEW_READ_UNDECLARED = [] as const;

/**
 * The census result: declared, and NOT read off a named view. 43 today. A
 * document authoring any of these validates green (`BaseSchema` is
 * `.passthrough()`) and changes nothing — the finding objectui#7924 records.
 *
 * ⭐ TWO OF THE 43 ARE objectui#8980's OWN, AND THAT IS THE RULED OUTCOME, not
 * an oversight: `tabs` and `pageName`. The ruling's item 2 requires a member
 * with no renderer behaviour to attach to be DECLARED and REPORTED with its
 * measurement — ⛔ not silently declared inert and ⛔ not dropped from the type.
 * The measurements, reported on objectui#8980: objectui's tab bar for an object
 * is the host-owned saved-view switcher (ADR-0053), so nothing on this surface
 * reads the list shape's `ViewTabSchema[]`; and `page` is not a member of
 * `NamedListView['type']`, so no authored named view can select the branch
 * `pageName` configures.
 */
const NAMED_LIST_VIEW_UNREAD = [
  'addDeleteRecordsInline', 'addRecord', 'addRecordViaForm', 'allowExport', 'allowPrinting',
  'aria', 'bulkActionDefs', 'bulkActions', 'clickIntoRecordDetails', 'collapseAllByDefault',
  'color', 'compactToolbar', 'conditionalFormatting', 'densityMode', 'description', 'emptyState',
  'exportOptions', 'fieldTextColor', 'filterableFields', 'hiddenFields', 'inlineEdit',
  'navigation', 'pageName', 'pagination', 'prefixField', 'resizable', 'rowActions', 'rowHeight',
  'searchableFields', 'selection', 'sharing', 'showColor', 'showDensity', 'showDescription',
  'showFilters', 'showGroup', 'showHideFields', 'showRecordCount', 'showSearch', 'showSort',
  'tabs', 'userFilters', 'wrapHeaders',
] as const;

/**
 * Two members of the unread set that the renderer does not mention AT ALL —
 * not off the named view, not off `activeView`, not off the node. The sharp end
 * of the census: for these the "declared, unenforced, unread" reading has no
 * host-side twin to weigh against it.
 */
const UNREAD_ABSENT_FROM_RENDERER = ['bulkActionDefs', 'exportOptions'] as const;

/**
 * The named-view read probe's FIRING CONTROL, and its negative twin. Both are
 * declared members; the control is read off a named view and the counter-control
 * is not, so a probe that returns them correctly is a probe that is running.
 */
const NAMED_VIEW_READ_CONTROL = 'columns';
const NAMED_VIEW_UNREAD_CONTROL = 'rowHeight';
/** A plausible list-view spelling that is neither declared nor read. */
const NAMED_VIEW_ABSENT_CONTROL = 'stickyHeader';

/** The syntactic roles every occurrence of the named-views RECORD may take. */
const RECORD_ROLES = [
  'COMPARISON', 'CONDITION', 'DECLARATION', 'ELEMENT_ACCESS', 'HOOK_DEPENDENCY',
  'OBJECT_ENTRIES', 'OBJECT_KEYS',
] as const;

/** The documented node; every assertion below is a delta on it. */
const NODE = { type: 'object-view', objectName: 'accounts' } as const;

/** One value per mirrored key that the declaration admits — the accept leg. */
const ACCEPTED: Record<Mirrored, unknown> = {
  navigation: { mode: 'drawer', view: 'summary_view' },
  searchableFields: ['name', 'email'],
  filterableFields: ['status'],
  allowCreateView: true,
  viewActions: [{ type: 'share', icon: 'share-2' }, { type: 'delete' }],
  defaultViewType: 'kanban',
  defaultListView: 'all',
  showViewSwitcher: true,
};

/* ── Type-level pins (invariant equality, house form) ─────────────────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
/** The canonical `any` detector: only `any` absorbs `1 &` down to something `0` extends. */
type IsAny<T> = 0 extends (1 & T) ? true : false;

type ViewKind = 'grid' | 'kanban' | 'gallery' | 'calendar' | 'timeline' | 'gantt' | 'map';

// `defaultViewType`: the declaration's SEVEN-value union, optional, not `any`.
export type _DefaultViewTypeIsSevenUnion = Expect<Equal<TsObjectViewSchema['defaultViewType'], ViewKind | undefined>>;
export type _DefaultViewTypeIsNotAny = Expect<Equal<IsAny<TsObjectViewSchema['defaultViewType']>, false>>;
// `viewTabBar`: a `?: never` tombstone — the only value it admits is absence.
// Deleting the member instead would make this `any` (index signature) and the
// pin red, which is the point: the tombstone is load-bearing.
export type _ViewTabBarIsTombstone = Expect<Equal<TsObjectViewSchema['viewTabBar'], undefined>>;
export type _ViewTabBarIsNotAny = Expect<Equal<IsAny<TsObjectViewSchema['viewTabBar']>, false>>;
// `listViews`: STILL the declaration's local value — this card moved neither face.
export type _ListViewsIsTheLocalRecord = Expect<Equal<TsObjectViewSchema['listViews'], Record<string, NamedListView> | undefined>>;
// The control key is NOT declared: it resolves to `any` through the index
// signature, exactly as the ten did on the zod side before this card.
export type _ControlKeyFallsThroughToIndexSignature = Expect<IsAny<TsObjectViewSchema['viewSwitcherPosition']>>;

// The TS face accepts the documented shape on a literal.
export const literal: TsObjectViewSchema = { ...NODE, ...(ACCEPTED as Record<Mirrored, never>) };
// …REFUSES the retired spelling on a literal (an object is not `never`). This
// directive goes unused — and the type-check goes red with TS2578 — the moment
// the tombstone is deleted or widened back to `ViewTabBarConfig`.
// @ts-expect-error — `viewTabBar` is RETIRED on this node (objectui#7779); it was never read
export const retiredLiteral: TsObjectViewSchema = { ...NODE, viewTabBar: { showAddButton: true } };
// …and REFUSES the host-only view kind: `tree` is not authorable here (objectui#5321).
// @ts-expect-error — `defaultViewType` is the seven-value union; `tree` is host composition only
export const hostOnlyLiteral: TsObjectViewSchema = { ...NODE, defaultViewType: 'tree' };

/* ── Off-disk derivations ─────────────────────────────────────────────────── */

function readRepo(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf8');
}

/** Every `schema.KEY` / `(schema as any).KEY` read in a source file, off disk. */
function schemaReads(rel: string): Set<string> {
  const src = readRepo(rel);
  return new Set([...src.matchAll(/\bschema(?: as any\))?\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
}

/** Every `currentNamedViewConfig?.KEY` read in the renderer — the named-view read set. */
function namedViewReads(): string[] {
  const src = readRepo(READER);
  return [...new Set([...src.matchAll(/currentNamedViewConfig(?: as any\))?\?\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))].sort();
}

/** Top-level members of `NamedListView`, counted off the declaration source. */
function namedListViewMemberCount(): number {
  const src = readRepo(DECLARATION);
  const start = src.indexOf('export interface NamedListView {');
  expect(start, 'NamedListView is no longer declared where this pin reads it').toBeGreaterThan(-1);
  const end = src.indexOf('\n}\n', start);
  const body = src.slice(start, end);
  return [...body.matchAll(/^ {2}[A-Za-z_$][\w$]*\??:/gm)].length;
}

/**
 * The SAME count with the indent anchor dropped — the looser instrument. It also
 * matches nested object-literal lines inside the members' inline types, which is
 * why it reads higher. Kept so the gap between the two instruments is an
 * assertion rather than a sentence: the retired "about 52 members" is a hand
 * figure that sits between them and is neither.
 */
function namedListViewLooseMemberCount(): number {
  const src = readRepo(DECLARATION);
  const start = src.indexOf('export interface NamedListView {');
  const end = src.indexOf('\n}\n', start);
  return [...src.slice(start, end).matchAll(/^\s*[A-Za-z_$][\w$]*\??:/gm)].length;
}

/* ── objectui#7924: the census instruments, by the TypeScript parser ────────
 * ⛔ NOT a regex and ⛔ NOT a brace-depth count. A brace parser on this repo has
 * already failed to terminate at an object's close (objectui#8071), and the two
 * regexes above are the instrument this pair replaces — they are kept only as
 * the cross-check that the reading did not move when the instrument did.
 */

function sourceFileOf(rel: string, kind: ts.ScriptKind): ts.SourceFile {
  const abs = join(REPO_ROOT, rel);
  return ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true, kind);
}

function allNodes(sf: ts.SourceFile): ts.Node[] {
  const out: ts.Node[] = [];
  (function walk(n: ts.Node) { out.push(n); ts.forEachChild(n, walk); })(sf);
  return out;
}

/** Strip the wrappers an access rides through: `( )`, `!`, `as T`, `satisfies T`. */
function unwrapExpr(e: ts.Expression): ts.Expression {
  for (;;) {
    if (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) {
      e = e.expression;
      continue;
    }
    return e;
  }
}

/** Is `node` the call `Object.METHOD(...)`? */
function isObjectStatic(node: ts.Node, method: string): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  const callee = unwrapExpr(node.expression);
  return ts.isPropertyAccessExpression(callee)
    && ts.isIdentifier(callee.expression)
    && callee.expression.text === 'Object'
    && callee.name.text === method;
}

const DEP_ARRAY_HOOKS = new Set(['useMemo', 'useCallback', 'useEffect', 'useLayoutEffect']);

interface NamedListViewCensus {
  /** Declared member names, in declaration order. */
  names: string[];
  /** The members with no `?` — the census records shape, not only names. */
  required: string[];
  /** Anything that is not a plain named property signature (index signature, call signature…). */
  nonProperty: string[];
  heritage: string[];
}

/** `NamedListView`'s top-level members, walked off the interface's own AST. */
function namedListViewMembers(): NamedListViewCensus {
  const sf = sourceFileOf(DECLARATION, ts.ScriptKind.TS);
  let iface: ts.InterfaceDeclaration | undefined;
  for (const n of allNodes(sf)) {
    if (ts.isInterfaceDeclaration(n) && n.name.text === 'NamedListView') iface = n;
  }
  expect(iface, `\`NamedListView\` is no longer an interface declaration in ${DECLARATION}`).toBeDefined();
  const names: string[] = [];
  const required: string[] = [];
  const nonProperty: string[] = [];
  for (const m of iface!.members) {
    if (!ts.isPropertySignature(m)) { nonProperty.push(ts.SyntaxKind[m.kind]); continue; }
    const name = ts.isIdentifier(m.name) || ts.isStringLiteral(m.name) ? m.name.text : null;
    if (name === null) { nonProperty.push('ComputedPropertyName'); continue; }
    names.push(name);
    if (!m.questionToken) required.push(name);
  }
  return { names, required, nonProperty, heritage: (iface!.heritageClauses ?? []).map((h) => h.getText(sf)) };
}

interface NamedViewReadDerivation {
  /** Variables bound to the named-views RECORD (`schema.listViews`). */
  record: string[];
  /** Variables holding a single named VIEW. */
  valueBindings: string[];
  /** Property names read off a named view, sorted. */
  reads: string[];
  /** Read name → the 1-based lines it is read on. */
  readSites: Record<string, number[]>;
  /** `line:ROLE` for every occurrence of a record binding. */
  recordRoles: string[];
}

/**
 * What the renderer reads OFF A NAMED VIEW — kept strictly apart from what it
 * reads off `activeView` (the host's `views` prop), which is the whole finding:
 * `rowHeight: activeView?.rowHeight` is NOT a named-view read.
 *
 * Every route from the record to a named view is derived, not listed:
 *   RECORD  — a variable initialised from `schema.listViews`.
 *   VALUE   — a binding annotated `NamedListView`; the value binding of
 *             `Object.entries(RECORD).map(([key, view]) => …)` (through an
 *             intermediate `const entries = …` too); or an element access
 *             straight off the RECORD.
 *   READ    — a property access whose object is a VALUE, after `( )` / `!` /
 *             `as any` are stripped. The cast is why `data` is found at all.
 *
 * `recordRoles` is the completeness half: every occurrence of the RECORD is
 * classified, so a NEW route to a named view lands as `UNCLASSIFIED` and fails
 * before this census can silently under-count.
 */
function deriveNamedViewReads(): NamedViewReadDerivation {
  const sf = sourceFileOf(READER, ts.ScriptKind.TSX);
  const all = allNodes(sf);
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

  const record = new Set<string>();
  for (const n of all) {
    if (!ts.isVariableDeclaration(n) || !n.initializer || !ts.isIdentifier(n.name)) continue;
    const init = unwrapExpr(n.initializer);
    if (ts.isPropertyAccessExpression(init) && ts.isIdentifier(init.expression)
      && init.expression.text === 'schema' && init.name.text === LEDGERED) {
      record.add(n.name.text);
    }
  }

  const valueBindings = new Set<string>();
  for (const n of all) {
    if (!ts.isVariableDeclaration(n) || !ts.isIdentifier(n.name) || !n.type) continue;
    let mentions = false;
    (function walk(t: ts.Node) {
      if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName) && t.typeName.text === 'NamedListView') mentions = true;
      ts.forEachChild(t, walk);
    })(n.type);
    if (mentions) valueBindings.add(n.name.text);
  }

  const entryBindings = new Set<string>();
  for (const n of all) {
    if (!ts.isVariableDeclaration(n) || !n.initializer || !ts.isIdentifier(n.name)) continue;
    const init = unwrapExpr(n.initializer);
    if (!isObjectStatic(init, 'entries')) continue;
    const arg = init.arguments[0] && unwrapExpr(init.arguments[0]);
    if (arg && ts.isIdentifier(arg) && record.has(arg.text)) entryBindings.add(n.name.text);
  }
  const isEntriesOfRecord = (e: ts.Expression): boolean => {
    const x = unwrapExpr(e);
    if (ts.isIdentifier(x) && entryBindings.has(x.text)) return true;
    if (isObjectStatic(x, 'entries')) {
      const arg = x.arguments[0] && unwrapExpr(x.arguments[0]);
      return !!arg && ts.isIdentifier(arg) && record.has(arg.text);
    }
    return false;
  };
  for (const n of all) {
    if (!ts.isCallExpression(n)) continue;
    const callee = unwrapExpr(n.expression);
    if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== 'map') continue;
    if (!isEntriesOfRecord(callee.expression)) continue;
    const cb = n.arguments[0];
    if (!cb || !(ts.isArrowFunction(cb) || ts.isFunctionExpression(cb))) continue;
    const p0 = cb.parameters[0];
    if (!p0 || !ts.isArrayBindingPattern(p0.name)) continue;
    const el = p0.name.elements[1];
    if (el && ts.isBindingElement(el) && ts.isIdentifier(el.name)) valueBindings.add(el.name.text);
  }

  const isNamedViewValue = (e: ts.Expression): boolean => {
    const x = unwrapExpr(e);
    if (ts.isIdentifier(x) && valueBindings.has(x.text)) return true;
    if (ts.isElementAccessExpression(x)) {
      const obj = unwrapExpr(x.expression);
      return ts.isIdentifier(obj) && record.has(obj.text);
    }
    return false;
  };

  const readSites: Record<string, number[]> = {};
  for (const n of all) {
    if (!ts.isPropertyAccessExpression(n) || !isNamedViewValue(n.expression)) continue;
    (readSites[n.name.text] ??= []).push(lineOf(n));
  }

  const recordRoles: string[] = [];
  for (const n of all) {
    if (!ts.isIdentifier(n) || !record.has(n.text) || !n.parent) continue;
    const p = n.parent;
    const gp = p.parent as ts.Node | undefined;
    let role = 'UNCLASSIFIED';
    if (ts.isVariableDeclaration(p) && p.name === n) role = 'DECLARATION';
    else if (ts.isElementAccessExpression(p) && p.expression === n) role = 'ELEMENT_ACCESS';
    else if (ts.isNonNullExpression(p) && gp && ts.isElementAccessExpression(gp) && gp.expression === p) role = 'ELEMENT_ACCESS';
    else if (isObjectStatic(p, 'keys')) role = 'OBJECT_KEYS';
    else if (isObjectStatic(p, 'entries')) role = 'OBJECT_ENTRIES';
    else if (ts.isNonNullExpression(p) && gp && isObjectStatic(gp, 'keys')) role = 'OBJECT_KEYS';
    else if (ts.isNonNullExpression(p) && gp && isObjectStatic(gp, 'entries')) role = 'OBJECT_ENTRIES';
    else if (ts.isBinaryExpression(p)) role = 'COMPARISON';
    else if (ts.isIfStatement(p) && p.expression === n) role = 'CONDITION';
    else if (ts.isPrefixUnaryExpression(p) && p.operator === ts.SyntaxKind.ExclamationToken) role = 'CONDITION';
    else if (ts.isArrayLiteralExpression(p) && gp && ts.isCallExpression(gp) && gp.arguments[1] === p
      && ts.isIdentifier(gp.expression) && DEP_ARRAY_HOOKS.has(gp.expression.text)) role = 'HOOK_DEPENDENCY';
    recordRoles.push(`${lineOf(n)}:${role}`);
  }

  return {
    record: [...record].sort(),
    valueBindings: [...valueBindings].sort(),
    reads: Object.keys(readSites).sort(),
    readSites,
    recordRoles,
  };
}

function shapeKeys(schema: unknown): string[] {
  return Object.keys((schema as { shape: Record<string, unknown> }).shape);
}

function shapeMember(schema: unknown, key: string): unknown {
  return (schema as { shape: Record<string, unknown> }).shape[key];
}

interface Issue {
  path?: readonly (string | number)[];
  message?: string;
  code?: string;
  /** zod 4 `invalid_union`: the issues of every option that was tried. */
  errors?: readonly (readonly Issue[])[];
}

/**
 * Every issue as `path` + `message`, with the nested option errors of an
 * `invalid_union` flattened in: `AnyComponentSchema` is a plain `z.union`, so
 * a refusal inside the `object-view` arm surfaces as one root `invalid_union`
 * issue whose `errors` carry the per-arm paths.
 */
function issueEntries(issues: readonly Issue[], prefix: readonly (string | number)[] = []): Array<{ path: string; message: string; code: string }> {
  const out: Array<{ path: string; message: string; code: string }> = [];
  for (const issue of issues) {
    const path = [...prefix, ...(issue.path ?? [])];
    out.push({ path: path.join('.'), message: issue.message ?? '', code: issue.code ?? '' });
    for (const nested of issue.errors ?? []) out.push(...issueEntries(nested, path));
  }
  return out;
}

function issuePaths(issues: readonly Issue[]): string[] {
  return issueEntries(issues).map((e) => e.path);
}

/** Does any issue sit AT the key or below it (`key`, `key.0`, `key.mode`)? */
function refusedAt(issues: readonly Issue[], key: string): boolean {
  return issuePaths(issues).some((p) => p === key || p.startsWith(`${key}.`));
}

/* ── The reads ────────────────────────────────────────────────────────────── */

describe('objectui#7779 — the renderer reads the eight mirrored keys, which is the fact the mirror records', () => {
  it('the batch is exactly the eight keys the card mirrored, in its three dispositions', () => {
    // Non-vacuity for every per-key assertion below, and the card's own bound.
    expect(SPEC_REFERENCED).toHaveLength(3);
    expect(SIBLING_REFERENCED).toHaveLength(2);
    expect(LOCAL_LITERALS).toHaveLength(3);
    expect(MIRRORED).toHaveLength(8);
    expect(new Set<string>(MIRRORED).size).toBe(8);
  });

  it.each(MIRRORED)('`%s` is still read, as the exact text the docblocks cite', (key) => {
    for (const [file, text] of READ_TEXT[key]) {
      expect(readRepo(file), `${file} no longer reads \`${key}\` as \`${text}\``).toContain(text);
    }
  });

  it('the registration still exposes the three local literals as editable props', () => {
    const src = readRepo(REGISTRATION);
    for (const text of REGISTRATION_TEXT) expect(src).toContain(text);
  });

  it('the read set, derived from the renderer and the switcher, contains every mirrored key and the read control — and NOT the retired key or the control key', () => {
    const reads = new Set([...schemaReads(READER), ...schemaReads(SWITCHER)]);
    for (const key of MIRRORED) expect(reads.has(key), `renderer no longer reads schema.${key}`).toBe(true);
    // The positive control: the query that returns zero for `viewTabBar` is
    // the same query that returns `objectName`, so the zero is a reading.
    expect(reads.has(READ_CONTROL_KEY)).toBe(true);
    // The retirement's premise: nothing on this node ever read `viewTabBar`.
    // If the renderer starts reading it, the tombstone is wrong and this turns
    // red BEFORE anyone re-authors the key.
    expect(reads.has(RETIRED)).toBe(false);
    // Non-vacuity for the control key: if the renderer ever starts reading it,
    // this turns red and the control must be re-chosen, not declared on the
    // way past.
    expect(reads.has(CONTROL_KEY)).toBe(false);
  });

  it('`viewTabBar` reaches the tab bar only as a component PROP from the host, never off the node', () => {
    // The boundary the retirement's docblock states: `ViewTabBar` takes
    // `config?: ViewTabBarConfig` as a prop; the node renderer renders no tab
    // bar itself (ADR-0053, host owns the switcher).
    expect(readRepo('packages/plugin-view/src/ViewTabBar.tsx')).toContain('config?: ViewTabBarConfig;');
    expect(readRepo(READER)).not.toMatch(/<ViewTabBar\b/);
    expect(readRepo(READER)).not.toMatch(/\bviewTabBar\b/);
  });
});

/* ── The zod mirror: membership ───────────────────────────────────────────── */

describe('objectui#7779 — the zod mirror declares the eight keys and the tombstone, and NOT `listViews`', () => {
  it.each([...MIRRORED, RETIRED])('`%s` is a member of the mirror shape (membership cannot be read off acceptance under passthrough)', (key) => {
    expect(shapeKeys(ObjectViewSchema)).toContain(key);
  });

  it('`listViews` is STILL not a member — the ruling\'s fallback clause, pinned so the ledger entry cannot go stale unnoticed', () => {
    expect(shapeKeys(ObjectViewSchema)).not.toContain(LEDGERED);
  });

  it('the control key is undeclared on the mirror too', () => {
    expect(shapeKeys(ObjectViewSchema)).not.toContain(CONTROL_KEY);
  });
});

/* ── By reference: the spec slots and the sibling slots ───────────────────── */

describe('objectui#7779 — the three spec-modelled keys are the spec\'s own slots BY REFERENCE', () => {
  it.each(SPEC_REFERENCED)('`%s` IS `SpecListViewSchema.shape.%s` — the same object, not a copy', (key) => {
    // ⭐ objectui#8317 (decision batch #90): the spec enters this package through
    // `stripImportedDefaults`, so the object to compare against is
    // `SpecListViewSchema` AS IT ARRIVES HERE. That hop removes the imported
    // `ZodDefault`s and nothing else — a slot with none comes back
    // reference-equal, which is why `searchableFields` and `filterableFields`
    // are unchanged by it and `navigation` (four defaults) is not.
    // ⛔ Still `toBe`: a local restatement is the drift objectui#4588 measured.
    expect(
      shapeMember(ObjectViewSchema, key),
      `ObjectViewSchema.${key} must be stripImportedDefaults(SpecListViewSchema).shape.${key} by ` +
        'reference — a local restatement is the drift objectui#4588 measured; if the spec slot is ' +
        'wrong, fix the spec',
    ).toBe(shapeMember(stripImportedDefaults(SpecListViewSchema), key));
  });

  it.each(SPEC_REFERENCED)('`%s` is also the slot `ObjectListViewSchema` carries under that name (the spec models it on both view faces)', (key) => {
    // Not identity — the spec builds the two objects separately — but the same
    // accept set on the probes below, which is what "models it" means.
    const a = shapeMember(SpecListViewSchema, key) as { safeParse(v: unknown): { success: boolean } };
    const b = shapeMember(SpecObjectListViewSchema, key) as { safeParse(v: unknown): { success: boolean } };
    for (const probe of [undefined, ACCEPTED[key], 'page', 42, ['a'], { mode: 'bogus' }]) {
      expect(a.safeParse(probe).success, `${key} disagrees on ${JSON.stringify(probe)}`).toBe(b.safeParse(probe).success);
    }
  });

  it('`navigation` parses exactly as the spec\'s `NavigationConfigSchema` does (the slot is that schema, optional)', () => {
    const slot = shapeMember(ObjectViewSchema, 'navigation') as { safeParse(v: unknown): { success: boolean; data?: unknown } };
    // The spec declares `mode: NavigationModeSchema.default('page')`, so a
    // config that omits the mode is legal authored metadata — the exact input
    // the hand copy of objectui#4588 refused. ⭐ It is STILL accepted, and since
    // objectui#8317 (decision batch #90) the parsed document no longer carries a
    // `mode` the author did not write: acceptance unchanged, substitution gone.
    const defaulted = slot.safeParse({ view: 'summary_view' });
    expect(defaulted.success).toBe(true);
    expect((defaulted.data as { mode?: string }).mode).toBeUndefined();
    expect(defaulted.data).toEqual({ view: 'summary_view' });
    // …and a document that DOES write it round-trips unchanged, which is what
    // separates "stopped substituting" from "stopped declaring".
    expect(slot.safeParse({ view: 'summary_view', mode: 'page' }).data)
      .toEqual({ view: 'summary_view', mode: 'page' });
    // ⚠️ Two comparisons, deliberately. The first is against the spec slot AS IT
    // ENTERS THIS PACKAGE — the object actually under test. The second is
    // against the RAW spec slot, and it is the measurement that says the strip
    // moved no accept set: every probe agrees with upstream, defaults or not.
    const enteredSlot = stripImportedDefaults(SpecNavigationConfigSchema).optional();
    for (const probe of [{ mode: 'drawer' }, { mode: 'bogus' }, 'page', { mode: 'page', bogus: 1 }, undefined]) {
      expect(slot.safeParse(probe).success, JSON.stringify(probe)).toBe(enteredSlot.safeParse(probe).success);
      expect(
        slot.safeParse(probe).success,
        `${JSON.stringify(probe)} — the strip must move no accept set`,
      ).toBe(SpecNavigationConfigSchema.optional().safeParse(probe).success);
    }
    // A string is refused at `navigation`, an unknown mode at `navigation.mode`:
    // the spec's strict object, not a local `z.any()`.
    expect(SpecNavigationConfigSchema.safeParse({ mode: 'bogus' }).success).toBe(false);
    expect(SpecNavigationConfigSchema.safeParse({ mode: 'page', bogus: 1 }).success).toBe(false);
  });

  it('the spec describes `filterableFields` as the legacy shorthand — the deprecation the mirror now inherits by reference', () => {
    const slot = shapeMember(ObjectViewSchema, 'filterableFields') as { description?: string };
    expect(slot.description).toMatch(/legacy shorthand for userFilters\.fields/i);
  });
});

describe('objectui#7779 — `allowCreateView` / `viewActions` are the sibling `ViewSwitcherSchema` slots BY REFERENCE', () => {
  it.each(SIBLING_REFERENCED)('`%s` IS `ViewSwitcherSchema.shape.%s` — one shape for the key the renderer forwards verbatim', (key) => {
    expect(shapeMember(ObjectViewSchema, key)).toBe(shapeMember(ViewSwitcherSchema, key));
  });

  it('the switcher slot admits exactly the four action types the declaration spells, and refuses a fifth', () => {
    const slot = shapeMember(ObjectViewSchema, 'viewActions') as { safeParse(v: unknown): { success: boolean } };
    for (const type of ['share', 'settings', 'duplicate', 'delete']) {
      expect(slot.safeParse([{ type }]).success, type).toBe(true);
    }
    expect(slot.safeParse([{ type: 'archive' }]).success).toBe(false);
    expect(slot.safeParse([{ icon: 'x' }]).success).toBe(false);
  });
});

/* ── The accept leg and the refusal leg, per key ──────────────────────────── */

describe('objectui#7779 — each mirrored key is accepted with its declared value and the value SURVIVES the parse', () => {
  it('the documented node with all eight keys parses green, directly and through the union door', () => {
    const doc = { ...NODE, ...ACCEPTED };
    const r = ObjectViewSchema.safeParse(doc);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    const u = safeValidateSchema(doc);
    expect(u.success, u.success ? '' : JSON.stringify(u.error.issues)).toBe(true);
  });

  it.each(MIRRORED)('`%s` survives the parse with its value (spec defaults may be added, nothing is dropped)', (key) => {
    const r = ObjectViewSchema.safeParse({ ...NODE, [key]: ACCEPTED[key] });
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    if (!r.success) return;
    const out = (r.data as Record<string, unknown>)[key];
    if (key === 'navigation') {
      // `NavigationConfigSchema` fills its defaults on parse; the authored
      // members are still there and unchanged.
      expect(out).toMatchObject(ACCEPTED.navigation as Record<string, unknown>);
    } else {
      expect(out).toEqual(ACCEPTED[key]);
    }
  });

  it.each(MIRRORED)('`%s` is optional: the node without it parses green on both entry paths', (key) => {
    const doc: Record<string, unknown> = { ...NODE, ...ACCEPTED };
    delete doc[key];
    expect(ObjectViewSchema.safeParse(doc).success).toBe(true);
    expect(safeValidateSchema(doc).success).toBe(true);
  });
});

describe('objectui#7779 — each mirrored key REFUSES a wrong-typed value AT its key: the enforcement mirroring adds', () => {
  it.each([
    ['navigation', 'page'],
    ['navigation', { mode: 'bogus' }],
    ['searchableFields', 'name'],
    ['searchableFields', [1]],
    ['filterableFields', 'status'],
    ['allowCreateView', 'yes'],
    ['viewActions', 'share'],
    ['viewActions', [{ type: 'archive' }]],
    ['defaultViewType', 'tree'],
    ['defaultViewType', 42],
    ['defaultListView', 7],
    ['showViewSwitcher', 'true'],
  ] as const)('refuses `%s` = %j at the key, directly and through the union door', (key, value) => {
    // Before this card every one of these rode `.passthrough()` unexamined.
    // This is the verdict that moves, and it moves toward refusal.
    const r = ObjectViewSchema.safeParse({ ...NODE, [key]: value });
    expect(r.success).toBe(false);
    if (!r.success) expect(refusedAt(r.error.issues as readonly Issue[], key), JSON.stringify(issuePaths(r.error.issues as readonly Issue[]))).toBe(true);
    const u = safeValidateSchema({ ...NODE, [key]: value });
    expect(u.success).toBe(false);
    if (!u.success) expect(refusedAt(u.error.issues as readonly Issue[], key), JSON.stringify(issuePaths(u.error.issues as readonly Issue[]))).toBe(true);
  });

  it('`defaultViewType` admits exactly the seven declared kinds — not the spec\'s nine (`chart` / `tree` are host composition only, objectui#5321)', () => {
    const slot = shapeMember(ObjectViewSchema, 'defaultViewType') as { safeParse(v: unknown): { success: boolean } };
    for (const kind of ['grid', 'kanban', 'gallery', 'calendar', 'timeline', 'gantt', 'map']) {
      expect(slot.safeParse(kind).success, kind).toBe(true);
    }
    for (const kind of ['chart', 'tree', 'list', 'detail']) {
      expect(slot.safeParse(kind).success, kind).toBe(false);
    }
  });
});

/* ── The zod mirror: the retired key ──────────────────────────────────────── */

describe('objectui#7779 — the zod mirror REFUSES `viewTabBar` by name', () => {
  it('a `viewTabBar`-authored node is refused AT `viewTabBar`, and the message says why and what owns the config now', () => {
    const r = ObjectViewSchema.safeParse({ ...NODE, viewTabBar: { showAddButton: true } });
    expect(r.success).toBe(false);
    if (r.success) return;
    const entries = issueEntries(r.error.issues as readonly Issue[]);
    const hit = entries.find((e) => e.path === RETIRED);
    expect(hit, JSON.stringify(entries)).toBeDefined();
    expect(hit?.message).toContain('RETIRED (objectui#7779)');
    expect(hit?.message).toContain('ViewTabBar');
    expect(hit?.message).toContain('config');
    // A tombstone reports `invalid_type` — the same code a bare `z.never()`
    // reports — so tooling that classifies refusals is unchanged.
    expect(hit?.code).toBe('invalid_type');
  });

  it('…and through the published union entry point', () => {
    const u = safeValidateSchema({ ...NODE, viewTabBar: {} });
    expect(u.success).toBe(false);
    if (!u.success) expect(refusedAt(u.error.issues as readonly Issue[], RETIRED)).toBe(true);
  });

  it('absent stays valid on both entry paths — a node that never wrote the key is untouched', () => {
    expect(ObjectViewSchema.safeParse(NODE).success).toBe(true);
    expect(safeValidateSchema(NODE).success).toBe(true);
  });

  it('the guidance is the SAME string on both author-facing channels (message and describe)', () => {
    const slot = shapeMember(ObjectViewSchema, RETIRED) as { description?: string };
    const r = ObjectViewSchema.safeParse({ ...NODE, viewTabBar: true });
    expect(r.success).toBe(false);
    if (r.success) return;
    const hit = issueEntries(r.error.issues as readonly Issue[]).find((e) => e.path === RETIRED);
    expect(slot.description).toBe(hit?.message);
  });

  it('both faces carry the tombstone, lockstep — off disk, so deleting either half is caught', () => {
    expect(readRepo(DECLARATION)).toContain('viewTabBar?: never;');
    expect(readRepo(DECLARATION)).toContain('RETIRED (objectui#7779)');
    expect(readRepo(MIRROR)).toContain('viewTabBar: retirementTombstone(');
  });
});

/* ── `listViews`: the measurement that keeps it in the ledger ─────────────── */

describe('objectui#7779 — `listViews` stays unmirrored on the ruling\'s fallback clause; the measurement is pinned against the SPEC', () => {
  it('the spec slot `ViewSchema.listViews` is a record whose value is the strict `ObjectListViewSchema`', () => {
    const slot = shapeMember(SpecViewSchema, 'listViews') as { unwrap(): { def?: { type?: string; valueType?: unknown }; _def?: { type?: string; valueType?: unknown } } };
    const inner = slot.unwrap();
    const def = inner.def ?? inner._def;
    expect(def?.type).toBe('record');
    expect(def?.valueType).toBe(SpecObjectListViewSchema);
    // Strict: an unknown key is refused, not stripped — the reason a spec-typed
    // value cannot admit the local `NamedListView` vocabulary.
    const r = SpecObjectListViewSchema.safeParse({ label: 'x', columns: ['a'], options: {} });
    expect(r.success).toBe(false);
    if (!r.success) expect((r.error.issues as readonly Issue[]).some((i) => i.code === 'unrecognized_keys')).toBe(true);
  });

  it('the spec value REFUSES the named views this package\'s docs teach — the behaviour a by-reference mirror would lose', () => {
    // README / plugin-view.mdx: `listViews: { all: { label: 'All Users' } }` —
    // "each needs a `label`", nothing else. The spec requires `columns`.
    const labelOnly = SpecObjectListViewSchema.safeParse({ label: 'All Users' });
    expect(labelOnly.success).toBe(false);
    if (!labelOnly.success) expect(refusedAt(labelOnly.error.issues as readonly Issue[], 'columns')).toBe(true);
    // README: a `filter`-only view with `type: 'grid'` and no `columns`.
    const filtered = SpecObjectListViewSchema.safeParse({ label: 'Under 100', type: 'grid', filter: [{ field: 'price', operator: 'less_than', value: 100 }] });
    expect(filtered.success).toBe(false);
    if (!filtered.success) expect(refusedAt(filtered.error.issues as readonly Issue[], 'columns')).toBe(true);
    // schema-reference.md: an ObjectQL tuple filter and a `default: true` flag.
    const tuple = SpecObjectListViewSchema.safeParse({ label: 'My Deals', columns: ['name'], filter: [['owner', '=', '${currentUser.id}']] });
    expect(tuple.success).toBe(false);
    if (!tuple.success) expect(refusedAt(tuple.error.issues as readonly Issue[], 'filter')).toBe(true);
    const flagged = SpecObjectListViewSchema.safeParse({ label: 'My Deals', columns: ['name'], default: true });
    expect(flagged.success).toBe(false);
    // The control: the shape the schema catalog authors IS accepted, so the
    // refusals above are readings of the dialect, not of the schema being
    // uniformly closed.
    expect(SpecObjectListViewSchema.safeParse({ label: 'Directory', columns: ['name', 'email'] }).success).toBe(true);
  });

  it('the documented shapes the spec refuses are still what the docs teach (the measurement\'s inputs, off disk)', () => {
    expect(readRepo(README)).toContain("listViews: { all: { label: 'All Users' } }");
    expect(readRepo(DOC)).toContain("listViews: { all: { label: 'All Users' } }");
    expect(readRepo('content/docs/api/schema-reference.md')).toContain('"filter": [["owner", "=", "${currentUser.id}"]],');
  });

  it('the renderer reads twenty-one keys off a named view — every one of them a declared `NamedListView` member since objectui#8980 — of a declaration with 64, the reason a local key-for-key mirror is still not the answer', () => {
    // ⚠️ The REGEX instrument sees twenty, not twenty-one: `name` is read only
    // at the tab strip (`view.name`), which `currentNamedViewConfig?.KEY` cannot
    // see. The AST derivation below finds it; the gap between the two is
    // asserted by name there rather than papered over here.
    expect(namedViewReads()).toEqual([...NAMED_VIEW_READS].filter((k) => k !== 'name'));
    // The tab strip reads `label` off the entries too — same member, second
    // site — and since objectui#8980 `name` between it and the record key.
    expect(readRepo(READER)).toContain('{view.label || view.name || key}');
    // ALL twenty-one are declared `NamedListView` members since objectui#8980:
    // the seventeen the protocol declares on this surface landed with a read
    // point each, and `data` — which used to reach the renderer through an
    // `as any` cast on the named-view config — is one of them. So the "unread"
    // arithmetic below subtracts the whole read set rather than the read set
    // minus one. Both directions stay pinned: a member added or removed moves
    // the exact count and fails here; a read dropped shortens
    // `namedViewReads()` and fails above.
    const declared = namedListViewMembers().names.length;
    // HOW THIS NUMBER IS TAKEN: `namedListViewMembers()` — the TypeScript parser
    // walking the interface's own `PropertySignature` members (objectui#7924).
    // It REPLACED the regex `namedListViewMemberCount()`, which is kept beside it
    // and asserted to agree, so the instrument change is itself a measurement.
    // A looser count that drops that regex's two-space indent anchor also matches
    // nested object-literal lines inside the members' inline types and gives 59 on
    // the same declaration; a hand figure between the two is where the retired
    // "about 52 members" came from. ⛔ Do not re-derive the loose number and quote
    // it beside this one — they measure different things. The three instruments
    // are pinned against each other in the objectui#7924 census below.
    // Pinned EXACT rather than floored: the retired `>= 40` floor permitted the
    // declaration to shed seven members, including a shrink toward the read set,
    // which is exactly the condition that re-opens the `listViews` decision
    // (objectui#7928); and a floor cannot catch growth at all, so the quoted
    // figures could stale silently in either direction.
    expect(
      declared,
      'NamedListView\'s top-level member count moved (was 64 — 47 plus objectui#8980\'s seventeen). Re-derive it with this file\'s own namedListViewMemberCount() regex, then update the "64 declared / 43 unread" figures in the three files that carry them together — .changeset/object-view-unmirrored-keys-7779.md, packages/types/src/zod/objectql.zod.ts and packages/types/src/__tests__/zod-mirror-parity.test.ts — plus this file\'s own header. A shrink toward the read set also re-opens the listViews decision (objectui#7928).',
    ).toBe(64);
    expect(declared).toBeGreaterThan(NAMED_VIEW_READS.length);
  });

  it('the TS face still declares `listViews` as the local record (neither face moved)', () => {
    expect(readRepo(DECLARATION)).toContain('listViews?: Record<string, NamedListView>;');
  });
});

/* ── objectui#7924: the per-member liveness census ────────────────────────── */

describe('objectui#7924 — the per-member liveness census on `NamedListView`, re-derived by the TypeScript parser', () => {
  it('the declaration is a plain interface — no heritage clause, no index signature, no computed member — so its property signatures ARE the population', () => {
    const { nonProperty, heritage, required } = namedListViewMembers();
    // Each of these would silently widen the population the census claims to
    // cover: inherited members are not walked, and an index signature admits
    // names no member list can enumerate.
    expect(nonProperty, 'a non-property member appeared; "the property signatures" is no longer the whole population').toEqual([]);
    expect(heritage, '`NamedListView` gained a heritage clause; inherited members are NOT in this census').toEqual([]);
    // `label` is the one member without a `?`. The census records shape, not
    // just names: a member turning required (or optional) moves what an author
    // must write, so it is pinned too.
    expect(required).toEqual(['label']);
  });

  it('the declared member set is EXACTLY the census, by name', () => {
    expect([...namedListViewMembers().names].sort()).toEqual([...NAMED_LIST_VIEW_DECLARED].sort());
    expect(NAMED_LIST_VIEW_DECLARED).toHaveLength(64);
    expect(new Set<string>(NAMED_LIST_VIEW_DECLARED).size).toBe(64);
  });

  it('all three instruments read the same declaration, and the two that disagree disagree for a stated reason', () => {
    const ast = namedListViewMembers().names.length;
    // The parser and the strict regex agree — that agreement is what licenses
    // replacing the regex without re-opening the number.
    expect(ast).toBe(64);
    expect(namedListViewMemberCount()).toBe(ast);
    // …and the loose regex does NOT, by 12, because it also counts nested
    // object-literal lines. The gap is still exactly 12 after objectui#8980:
    // every one of the seventeen new members is a single-line type reference,
    // so none of them adds a nested object literal for the loose instrument to
    // over-count. Pinned so "a figure between two instruments is neither" stays
    // a reading rather than a remembered sentence.
    expect(namedListViewLooseMemberCount()).toBe(76);
    expect(namedListViewLooseMemberCount()).toBeGreaterThan(ast);
  });

  it('every route from `schema.listViews` to a named view is the one this census walks', () => {
    const d = deriveNamedViewReads();
    expect(d.record, 'the named-views record is bound somewhere new').toEqual(['namedListViews']);
    // Two bindings hold a single named view: the memoised active config, and
    // the tab strip's `Object.entries(...).map(([key, view]) => …)` element.
    expect(d.valueBindings).toEqual(['currentNamedViewConfig', 'view']);
  });

  it('every occurrence of the record sits in a CLASSIFIED role — a new route fails here before the census can go stale', () => {
    const roles = deriveNamedViewReads().recordRoles;
    expect(roles.length).toBeGreaterThan(0);
    const unclassified = roles.filter((r) => r.endsWith(':UNCLASSIFIED'));
    expect(
      unclassified,
      'a new syntactic route from `schema.listViews` to a named view appeared at these lines. '
        + 'The read set below cannot be trusted until it is walked too: extend `deriveNamedViewReads()`, '
        + 'then re-derive the census — do NOT add the role to RECORD_ROLES to make this green.',
    ).toEqual([]);
    for (const role of roles) {
      expect(RECORD_ROLES as readonly string[]).toContain(role.split(':')[1]);
    }
  });

  it('the renderer reads exactly twenty-one names off a named view — every one of them declared', () => {
    const d = deriveNamedViewReads();
    expect(d.reads).toEqual([...NAMED_VIEW_READS]);
    expect(d.reads).toHaveLength(21);
    // ⭐ THE INSTRUMENTS NOW DISAGREE BY ONE NAME, and the difference is pinned
    // rather than smoothed over. The AST finds STRICTLY more than the
    // `currentNamedViewConfig?.KEY` regex it replaced — that was already true
    // for SITES (`{view.label || …}` on the tab strip is a named-view read the
    // regex cannot see), and objectui#8980 made it true for a NAME as well:
    // `name` is read ONLY at that tab strip. So the regex is a subset, and the
    // members it cannot see are asserted by name.
    const regexOnly = namedViewReads();
    expect(regexOnly.filter((r) => !d.reads.includes(r)), 'the regex found a read the AST did not — the AST is the authority and must be extended').toEqual([]);
    expect(
      d.reads.filter((r) => !regexOnly.includes(r)),
      'the set of named-view reads the `currentNamedViewConfig?.KEY` regex cannot see moved. '
        + 'It is the tab strip\'s `view.KEY` reads; re-derive it rather than widening this expectation.',
    ).toEqual(['name']);
    expect(d.readSites.label.length, '`label` is read at two sites: the delegation and the tab strip').toBe(2);
    expect(d.readSites.name.length, '`name` is read at exactly one site: the tab strip\'s display fallback').toBe(1);
  });

  it('the census partitions the declaration exactly: 21 read + 43 unread = 64, disjoint and exhaustive', () => {
    const declared = new Set(namedListViewMembers().names);
    const reads = new Set(deriveNamedViewReads().reads);
    const read = [...declared].filter((m) => reads.has(m)).sort();
    const unread = [...declared].filter((m) => !reads.has(m)).sort();
    expect(read).toEqual([...NAMED_VIEW_READ_DECLARED]);
    expect(unread).toEqual([...NAMED_LIST_VIEW_UNREAD]);
    expect(read).toHaveLength(21);
    expect(unread).toHaveLength(43);
    expect(read.length + unread.length).toBe(declared.size);
    expect(read.filter((m) => unread.includes(m))).toEqual([]);
  });

  it('`data` is READ off a named view and now DECLARED — objectui#7928\'s open half, answered by the objectui#8980 ruling', () => {
    const declared = new Set(namedListViewMembers().names);
    const reads = deriveNamedViewReads();
    const undeclared = reads.reads.filter((r) => !declared.has(r));
    // EMPTY, and the emptiness is the reading: nothing the renderer reads off a
    // named view is undeclared any more. A name appearing here is a new
    // cast-only read, which is the class objectui#7928 sends to a ruling — ⛔ do
    // not add it to NAMED_VIEW_READ_UNDECLARED to make this green.
    expect(undeclared).toEqual([...NAMED_VIEW_READ_UNDECLARED]);
    expect(undeclared).toHaveLength(0);
    expect(declared.has('data'), '`data` is a declared member since objectui#8980; the census arithmetic subtracts the whole read set').toBe(true);
    expect(reads.reads).toContain('data');
    // …and it is reached through the DECLARED path: the cast on the named-view
    // config is gone. The two neighbouring casts are untouched and stay — the
    // host `views` entry is an untyped host shape, and `data` on the node is one
    // of the 27 objectui#5097 host-composition keys.
    expect(readRepo(READER)).toContain('data: currentNamedViewConfig?.data ?? (activeView as any)?.data ?? (schema as any).data,');
    expect(readRepo(READER)).not.toContain('(currentNamedViewConfig as any)?.data');
  });

  it.each(NAMED_VIEW_READ_DECLARED)('READ — `%s` is declared AND read off a named view', (member) => {
    expect(namedListViewMembers().names, `\`${member}\` is no longer declared`).toContain(member);
    expect(deriveNamedViewReads().reads, `\`${member}\` is no longer read off a named view`).toContain(member);
  });

  it.each(NAMED_LIST_VIEW_UNREAD)('UNREAD — `%s` is declared and NOT read off a named view', (member) => {
    expect(namedListViewMembers().names, `\`${member}\` is no longer declared`).toContain(member);
    expect(
      deriveNamedViewReads().reads,
      `\`${member}\` is now READ off a named view. That is the census moving, not a test to update: `
        + 'move it to NAMED_VIEW_READ_DECLARED, re-derive the counts, and say so on objectui#7924 — '
        + 'the listViews mirror decision (objectui#7928) reads these two sets.',
    ).not.toContain(member);
  });

  it('the controls fire on the same instruments that produce every zero above', () => {
    const declared = namedListViewMembers().names;
    const reads = deriveNamedViewReads().reads;
    // ⭐ The firing control. The query that returns NOTHING for the 41 unread
    // members is the query that returns `columns` — so a zero is a reading and
    // not a parser that found nothing.
    expect(reads).toContain(NAMED_VIEW_READ_CONTROL);
    expect(declared).toContain(NAMED_VIEW_READ_CONTROL);
    // …and its negative twin: declared, and NOT read off a named view. It is
    // read off `activeView` instead (`rowHeight: activeView?.rowHeight`), which
    // is the distinction the whole finding turns on.
    expect(declared).toContain(NAMED_VIEW_UNREAD_CONTROL);
    expect(reads).not.toContain(NAMED_VIEW_UNREAD_CONTROL);
    expect(readRepo(READER)).toContain('rowHeight: activeView?.rowHeight,');
    // A spelling that is in neither set: non-vacuity for both probes at once.
    expect(declared).not.toContain(NAMED_VIEW_ABSENT_CONTROL);
    expect(reads).not.toContain(NAMED_VIEW_ABSENT_CONTROL);
  });

  it('two unread members are absent from the renderer ENTIRELY — no named-view read, no `activeView` read, no node read', () => {
    const src = readRepo(READER);
    for (const member of UNREAD_ABSENT_FROM_RENDERER) {
      expect(NAMED_LIST_VIEW_UNREAD as readonly string[]).toContain(member);
      expect(src, `\`${member}\` now appears in the renderer; re-take the census's absence column`)
        .not.toMatch(new RegExp(`\\b${member}\\b`));
    }
    // The control for those two absences: a member that IS mentioned, measured
    // by the same query. Without it "not found" is an unrun grep.
    expect(src).toMatch(new RegExp(`\\b${NAMED_VIEW_UNREAD_CONTROL}\\b`));
  });
});

/* ── Controls: what did NOT move ──────────────────────────────────────────── */

describe('objectui#7779 — neighbouring keys did not move, and the passthrough envelope is untouched', () => {
  it.each(['showSearch', 'showFilters', 'showSort', 'showCreate', 'showRefresh', 'layout', 'operations', 'table', 'form', 'title', 'description'])(
    '`%s` is still a mirror member',
    (key) => {
      expect(shapeKeys(ObjectViewSchema)).toContain(key);
    },
  );

  it('a neighbour still refuses a wrong-typed value the way it did before (`showSearch`, `layout`)', () => {
    const a = ObjectViewSchema.safeParse({ ...NODE, showSearch: 'yes' });
    expect(a.success).toBe(false);
    if (!a.success) expect(refusedAt(a.error.issues as readonly Issue[], 'showSearch')).toBe(true);
    const b = ObjectViewSchema.safeParse({ ...NODE, layout: 'popover' });
    expect(b.success).toBe(false);
    if (!b.success) expect(refusedAt(b.error.issues as readonly Issue[], 'layout')).toBe(true);
  });

  it('the host-composition surface still rides the passthrough (objectui#5097) — this card declared the measured keys and nothing else', () => {
    const r = ObjectViewSchema.safeParse({ ...NODE, wrapHeaders: true, [CONTROL_KEY]: 'left' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).wrapHeaders).toBe(true);
      expect((r.data as Record<string, unknown>)[CONTROL_KEY]).toBe('left');
    }
  });

  it('the mirror still requires the discriminator and the object binding', () => {
    expect(ObjectViewSchema.safeParse({ objectName: 'accounts' }).success).toBe(false);
    expect(ObjectViewSchema.safeParse({ type: 'object-view' }).success).toBe(false);
  });
});

/* ── Docs: the two tables that taught `viewTabBar` as authorable ──────────── */

describe('objectui#7779 — the docs no longer teach `viewTabBar` as an `object-view` node key', () => {
  it.each([README, DOC])('%s lists `ViewTabBarConfig` as the `ViewTabBar` prop, and drops `viewTabBar` from the node row', (file) => {
    const src = readRepo(file);
    const nodeRow = src.split('\n').find((line) => line.startsWith('| `ObjectViewSchema` |'));
    expect(nodeRow, 'the import table lost its ObjectViewSchema row').toBeDefined();
    expect(nodeRow).not.toMatch(/`viewTabBar`,/);
    expect(nodeRow).toContain('`viewTabBar` is retired');
    const configRow = src.split('\n').find((line) => line.startsWith('| `ViewTabBarConfig` |'));
    expect(configRow).toContain('`config` prop of `ViewTabBar`');
  });
});
