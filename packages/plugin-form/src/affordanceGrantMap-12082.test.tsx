/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The enumeration pin for the affordance-to-grant map (objectui#12082).
 *
 * `AFFORDANCE_GRANTS` in `@object-ui/core` names, for every console affordance
 * that offers a write, the grant it exercises; `resolveAffordance` /
 * `resolveFieldAffordance` are the one verdict every such affordance reads.
 * The family this closes — each affordance deciding on its own which grant it
 * reads — was fixed one member at a time before (objectui#4296, #10107,
 * #11000, #12047) and kept recurring, so this pin holds the whole table and
 * the whole tree, not one more member.
 *
 * ## What it holds
 *
 * 1. **The row set equals this file's own expectation table.** `EXPECTED_GRANT`
 *    below is written here, by hand, NOT derived from the map: a row added to
 *    the map without an expectation, or one dropped from it, turns this red.
 * 2. **Every row × four grant shapes** — create-only, edit-only, read-only and
 *    full — through the REAL `MePermissionsProvider`: each affordance shows
 *    exactly when its grant allows it. A row naming the wrong grant (the p1
 *    defect was a create affordance reading the edit grant) fails at least two
 *    shapes.
 * 3. **The field question** of every field row, over the same four shapes and
 *    over explicit field-level entries: the create question follows the
 *    server's insert rule (no entry → `allowCreate`), the edit question its
 *    update rule (no entry → `allowEdit`), and an explicit entry answers both
 *    alike.
 * 4. **The form reader itself** (`gateFormFields`, `closedFormAffordance`) over
 *    the four shapes, both modes — the p1 card's reader, read through the map.
 * 5. **Fail-open**: with no permission provider every row and every field
 *    question reads open, as the `fieldWriteGate.ts` docblock states.
 * 6. **The census**: no console source file outside the map reads a CRUD
 *    grant on its own. The population and the readers it refuses are named in
 *    that block; a reader added later that spells its own grant read — the
 *    shape of every earlier member of this family — turns it red, naming the
 *    file.
 * 7. **The write census** (the card's remainder): a census of grant READS
 *    cannot see an affordance that reads NO grant, and that was the shape of
 *    the five the first round left. So the second census counts the WRITES:
 *    every call site in the tree that invokes a create, update or delete on a
 *    data source (or one of the write helpers that wrap one) has an entry in
 *    `WRITE_SITES`, and an entry says which map row the site sits behind and
 *    which file reads it — or why it is not a map row's (the data door itself,
 *    a write helper, a write that is not a CRUD affordance), or that it is a
 *    write affordance with no row yet (`unmapped`, the backlog this census
 *    found, named one by one). A write site added later with no entry turns it
 *    red, naming the site; an entry whose site is gone turns it red too.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AFFORDANCE_GRANTS,
  resolveAffordance,
  resolveFieldAffordance,
  type ConsoleAffordance,
  type FieldAffordance,
} from '@object-ui/core';
import { MePermissionsProvider, usePermissions, type MePermissionsResponse } from '@object-ui/permissions';
import { closedFormAffordance, gateFormFields } from './fieldWriteGate';
import ts from 'typescript';
// The ONE answer to "is this span a comment, or code?" — a census that strips
// comments with a private regex reports clean over code a phantom comment ate.
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { stripComments as stripCommentsUntyped } from '../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const stripComments: (source: string) => string = stripCommentsUntyped;

afterEach(cleanup);

type Grant = 'create' | 'update' | 'delete';

/**
 * Which grant each affordance needs — written by hand, from the card's rows and
 * the census, never read off the map. The map must agree with it row for row.
 */
const EXPECTED_GRANT: Record<string, Grant> = {
  // The card's rows.
  createFormFields: 'create',
  editFormFields: 'update',
  recordEdit: 'update',
  listNew: 'create',
  listImport: 'create',
  lookupCreateNew: 'create',
  // The rows the census found.
  recordDelete: 'delete',
  importTemplate: 'create',
  listInlineEdit: 'update',
  listBulkDelete: 'delete',
  rowEdit: 'update',
  rowDelete: 'delete',
  gridAddRow: 'create',
  relatedNew: 'create',
  relatedRowEdit: 'update',
  relatedRowDelete: 'delete',
  attachmentUpload: 'create',
  attachmentDelete: 'delete',
  // The rows the write census found: affordances that read no grant at all.
  calendarQuickCreate: 'create',
  calendarReschedule: 'update',
  kanbanCardMove: 'update',
};

/** The field rows, and which grant their no-entry fallback reads. */
const EXPECTED_FIELD_GRANT: Record<string, Grant> = {
  createFormFields: 'create',
  editFormFields: 'update',
  listImport: 'create',
};

const OBJECT = 'pin_object';

/** The four grant shapes, as `/me/permissions` carries them, and the verbs each holds. */
const SHAPES: Array<{ shape: string; bits: Record<string, boolean>; holds: ReadonlySet<Grant> }> = [
  {
    shape: 'create-only',
    bits: { allowCreate: true, allowRead: true, allowEdit: false, allowDelete: false },
    holds: new Set<Grant>(['create']),
  },
  {
    shape: 'edit-only',
    bits: { allowCreate: false, allowRead: true, allowEdit: true, allowDelete: false },
    holds: new Set<Grant>(['update']),
  },
  {
    shape: 'read-only',
    bits: { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false },
    holds: new Set<Grant>(),
  },
  {
    shape: 'full',
    bits: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true },
    holds: new Set<Grant>(['create', 'update', 'delete']),
  },
];

const envelope = (bits: Record<string, boolean>, fields: MePermissionsResponse['fields'] = {}): MePermissionsResponse => ({
  authenticated: true,
  userId: 'u-pin',
  tenantId: null,
  roles: ['member'],
  permissionSets: ['member'],
  objects: { [OBJECT]: bits },
  fields,
});

/** The value `usePermissions()` hands a reader under `perms` — or with no provider at all. */
function principalUnder(perms: MePermissionsResponse | null): ReturnType<typeof usePermissions> {
  let captured: ReturnType<typeof usePermissions> | null = null;
  function Probe() {
    captured = usePermissions();
    return null;
  }
  render(perms ? (
    <MePermissionsProvider initialPermissions={perms}>
      <Probe />
    </MePermissionsProvider>
  ) : (
    <Probe />
  ));
  if (!captured) throw new Error('the probe did not render');
  return captured;
}

const ROWS = Object.keys(AFFORDANCE_GRANTS) as ConsoleAffordance[];
const FIELD_ROWS = ROWS.filter((r) => 'field' in AFFORDANCE_GRANTS[r]) as FieldAffordance[];

describe('the affordance-to-grant map: its rows (objectui#12082)', () => {
  it('the map has exactly the rows this pin expects — a row with no expectation turns this red', () => {
    expect([...ROWS].sort()).toEqual(Object.keys(EXPECTED_GRANT).sort());
    expect([...FIELD_ROWS].sort()).toEqual(Object.keys(EXPECTED_FIELD_GRANT).sort());
  });

  it('every row names the grant the expectation table names', () => {
    for (const row of ROWS) {
      expect(AFFORDANCE_GRANTS[row].grant, row).toBe(EXPECTED_GRANT[row]);
    }
  });
});

describe.each(SHAPES)('every row under a $shape grant (objectui#12082)', ({ bits, holds }) => {
  it('each affordance shows exactly when its grant allows it', () => {
    const perms = principalUnder(envelope(bits));
    const got = Object.fromEntries(
      ROWS.map((row) => [row, resolveAffordance(row, { objectSchema: { managedBy: 'platform' }, objectName: OBJECT, perms }).allowed]),
    );
    const want = Object.fromEntries(ROWS.map((row) => [row, holds.has(EXPECTED_GRANT[row])]));
    expect(got).toEqual(want);
  });

  it('each field row asks its own question: no field entry → the grant of the operation it writes', () => {
    const perms = principalUnder(envelope(bits));
    const got = Object.fromEntries(FIELD_ROWS.map((row) => [row, resolveFieldAffordance(row, perms, OBJECT, 'any_field')]));
    const want = Object.fromEntries(FIELD_ROWS.map((row) => [row, holds.has(EXPECTED_FIELD_GRANT[row])]));
    expect(got).toEqual(want);
  });

  it('an explicit field entry answers every field row alike, whatever the object grant', () => {
    const perms = principalUnder(
      envelope(bits, {
        [`${OBJECT}.locked`]: { readable: true, editable: false },
        [`${OBJECT}.open`]: { readable: true, editable: true },
      }),
    );
    for (const row of FIELD_ROWS) {
      // The server's field step refuses `editable: false` on insert and update
      // alike, and lets an editable entry through to object admission — which
      // is the row's object verdict above, not the field question.
      expect(resolveFieldAffordance(row, perms, OBJECT, 'locked'), `${row} locked`).toBe(false);
      expect(resolveFieldAffordance(row, perms, OBJECT, 'open'), `${row} open`).toBe(true);
    }
  });

  it.each(['create', 'edit'] as const)('the form reader, %s mode: fields and the form-wide lock follow the form row', (mode) => {
    const perms = principalUnder(envelope(bits));
    const allowed = holds.has(mode === 'create' ? 'create' : 'update');
    const fields: Array<{ name: string; disabled?: boolean }> = [{ name: 'title' }, { name: 'amount' }];
    const drawn = gateFormFields(fields, {
      perms,
      objectName: OBJECT,
      mode,
      objectSchema: null,
    })!;
    expect(drawn.map((f) => !!f.disabled)).toEqual([!allowed, !allowed]);
    expect(closedFormAffordance({ perms, objectName: OBJECT, mode, objectSchema: null })).toBe(
      allowed ? undefined : mode,
    );
  });
});

describe('the map\'s other two layers still intersect (objectui#12082)', () => {
  it('a bucket that closes a row keeps it closed under the full grant; a row with no CRUD bit ignores the bucket', () => {
    const perms = principalUnder(envelope(SHAPES[3].bits));
    for (const row of ROWS) {
      const verdict = resolveAffordance(row, { objectSchema: { managedBy: 'append-only' }, objectName: OBJECT, perms }).allowed;
      expect(verdict, row).toBe(AFFORDANCE_GRANTS[row].crud === null);
    }
  });

  it('an effective operation set that serves nothing closes every row with a CRUD bit', () => {
    const perms = principalUnder({
      ...envelope(SHAPES[3].bits),
      objects: { [OBJECT]: { ...SHAPES[3].bits, apiOperations: [] } },
    });
    for (const row of ROWS) {
      const verdict = resolveAffordance(row, { objectSchema: null, objectName: OBJECT, perms }).allowed;
      expect(verdict, row).toBe(AFFORDANCE_GRANTS[row].crud === null);
    }
  });
});

describe('fail-open: no permission provider mounted (objectui#12082)', () => {
  it('every row and every field question reads open', () => {
    const perms = principalUnder(null);
    expect(perms.isLoaded).toBe(false);
    for (const row of ROWS) {
      expect(resolveAffordance(row, { objectSchema: null, objectName: OBJECT, perms }).allowed, row).toBe(true);
    }
    for (const row of FIELD_ROWS) {
      expect(resolveFieldAffordance(row, perms, OBJECT, 'any_field'), row).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// The census: no console source reads a CRUD grant outside the map.
//
// Population: every `.ts` / `.tsx` under `packages/*/src` and `apps/*/src`,
// tests, stories and declaration files excluded, with comments stripped by
// `scripts/js-comment-mask.mjs`. The
// enumeration is a walk of the tree from this file's own location, and the
// control below holds that the walk reached the readers this card converted —
// a walk that found nothing would otherwise read as a clean tree.
//
// A read is one of the three shapes every earlier member of this family took:
//
//  - `can(x, '<write verb>')` / `check(x, '<write verb>')` — an object grant
//    read directly (write verbs only: `create`, `update`, `edit`, `delete`,
//    `import`);
//  - `checkField(x, f, 'write' | 'create')` — a field write question asked
//    directly;
//  - `resolveEffectiveCrudAffordances(` / `isObjectInlineEditable(` — the
//    policy half used as a verdict, without the grant.
//
// The map's own module and the policy module it reads are where these belong,
// and `@object-ui/permissions` is the resolver that answers them. Every other
// file must hold none, unless it is named in `OUT_OF_FAMILY` with the reason it
// is not an affordance-to-grant reader. READ gates (`can(x, 'read')`, the
// route, navigation and related-list visibility gates) are not matched: every
// one of the four grant shapes holds read, so they are a different question —
// may the caller SEE — and not this family's.
// ---------------------------------------------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/plugin-form/src -> repo root
const repoRoot = path.resolve(here, '../../..');

const HOME = new Set([
  'packages/core/src/utils/affordanceGrants.ts',
  'packages/core/src/utils/managedBy.ts',
]);
const RESOLVER_DIR = 'packages/permissions/src/';

const OUT_OF_FAMILY: Record<string, string> = {
  'packages/app-shell/src/utils/managedByEmptyState.ts':
    "chooses an empty list's COPY from the object's bucket ('entries appear automatically'), principal-independent by design; it shows or hides no affordance — the page's New button is the listNew row",
};

const READS: RegExp[] = [
  /\b(?:can|cannot|check)\(\s*[^,()]+,\s*['"](?:create|update|edit|delete|import)['"]\s*\)/,
  /\bcheckField\([^()]*,\s*['"](?:write|create)['"]\s*\)/,
  /\b(?:resolveEffectiveCrudAffordances|isObjectInlineEditable)\(/,
];

function sourcesUnder(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '__tests__') continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourcesUnder(full, out);
    else if (/\.tsx?$/.test(name) && !/\.(test|spec|stories)\.tsx?$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}


/** Every console source file: `.ts` / `.tsx` under `packages/*/src` and `apps/*/src`. */
function consoleSources(): string[] {
  const roots: string[] = [];
  for (const top of ['packages', 'apps']) {
    for (const pkg of readdirSync(path.join(repoRoot, top))) {
      const src = path.join(repoRoot, top, pkg, 'src');
      try {
        if (statSync(src).isDirectory()) roots.push(src);
      } catch {
        // no src/ — not a source package
      }
    }
  }
  return roots.flatMap((r) => sourcesUnder(r));
}

function census(): Map<string, number> {
  const hits = new Map<string, number>();
  for (const file of consoleSources()) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    const code = stripComments(readFileSync(file, 'utf8'));
    const n = code.split('\n').filter((line) => READS.some((re) => re.test(line))).length;
    if (n > 0) hits.set(rel, n);
  }
  return hits;
}

describe('the census: every affordance reads the map (objectui#12082)', () => {
  const hits = census();

  it('CONTROL — the walk reaches the map and the readers it replaced', () => {
    // The map's home module holds a read (its own call of the policy), so a
    // walk that reached nothing cannot pass as a clean tree.
    expect(hits.has('packages/core/src/utils/affordanceGrants.ts')).toBe(true);
    for (const reader of [
      'packages/plugin-form/src/fieldWriteGate.ts',
      'packages/app-shell/src/views/RecordDetailView.tsx',
      'packages/fields/src/widgets/LookupField.tsx',
    ]) {
      expect(readFileSync(path.join(repoRoot, reader), 'utf8'), reader).toMatch(/\bresolve(?:Field)?Affordance\b/);
    }
  });

  it('no console source outside the map reads a CRUD grant on its own', () => {
    const outside = [...hits.keys()]
      .filter((f) => !HOME.has(f) && !f.startsWith(RESOLVER_DIR))
      .sort();
    expect(
      outside,
      'A console source reads a CRUD grant without the affordance-to-grant map. Add the ' +
        "affordance's row to AFFORDANCE_GRANTS in @object-ui/core and read it through " +
        'resolveAffordance / resolveFieldAffordance, or — if it is not an affordance-to-grant ' +
        'reader — name it in OUT_OF_FAMILY here with the reason.',
    ).toEqual(Object.keys(OUT_OF_FAMILY).sort());
  });
});

// ---------------------------------------------------------------------------
// The write census: every write call site sits behind a map row, or says why
// not (objectui#12082, the card's remainder).
//
// Why a second census. The one above refuses a grant READ outside the map, so
// an affordance that reads NO grant is invisible to it — and that was exactly
// the shape the first round left behind (the object-view New, the calendar's
// quick-create and drag-to-reschedule, the kanban card move, the line-items
// add / remove). So this census starts from the other end, the WRITE.
//
// Population: the same console sources as above, parsed with the TypeScript
// parser (comments are trivia to it, so no comment mask is involved). A write
// call site is either
//
//  - a member call naming a `DataSource` write — `create(o, data)`,
//    `update(o, id, data)`, `delete(o, id)`, `bulk(o, op, rows)`,
//    `bulkUpdate(…)`, `bulkDelete(…)`, `batchTransaction(ops)` — with at least
//    the arity the `DataSource` interface gives it, which is what tells a
//    data-source `delete(o, id)` from a `Map` / `Set` / `URLSearchParams`
//    `delete(key)`; or
//  - a call of one of the WRITE_HELPERS below, which wrap that door.
//
// Each site is keyed `FILE :: SYMBOLS :: VERB` — the file, the chain of named
// enclosing functions (a declared function or method, a variable or property
// or JSX attribute holding a function), and the verb it writes. Keyed by
// SYMBOL, never by line (AGENTS.md #11): a line shift moves nothing, a renamed
// handler turns this red and asks for its entry to be re-read.
//
// What it does NOT see, said here rather than left to be assumed: a write
// that bypasses the `DataSource` door with a raw HTTP call (AGENTS.md #1
// forbids it; the attachment upload and the import template go through their
// own routes and are rows above), and an affordance that only LEADS to a write
// — a button that opens a form. The form's submit is a site here, behind the
// form rows; the opener itself is pinned by its own runtime test
// (`ObjectView.createGrant-12082.test.tsx` in `@object-ui/plugin-view`).
// ---------------------------------------------------------------------------

type Verb = 'create' | 'update' | 'delete' | 'batch';

/** `DataSource` write members: the verb each writes, and the arity a data-source call has. */
const MEMBER_WRITES: ReadonlyMap<string, { verb: Verb; arity: number }> = new Map([
  ['create', { verb: 'create', arity: 2 }],
  ['update', { verb: 'update', arity: 3 }],
  ['delete', { verb: 'delete', arity: 2 }],
  ['bulk', { verb: 'batch', arity: 3 }],
  ['bulkUpdate', { verb: 'update', arity: 2 }],
  ['bulkDelete', { verb: 'delete', arity: 2 }],
  ['batchTransaction', { verb: 'batch', arity: 1 }],
]);

/**
 * Functions that wrap the door: a call of one IS a write site. Each has a
 * `helper` entry below (its own body's door calls), and every `helper` entry
 * names one of these — so a new wrapper is classified once, at its body, and
 * its callers are counted from then on.
 */
const WRITE_HELPERS: Readonly<Record<string, Verb>> = {
  runBatchTransaction: 'batch',
  emulateBatchTransaction: 'batch',
  'recordDelete.run': 'delete',
  saveWithOcc: 'update',
};

type WriteSite =
  /** Behind map rows: each row is read (`resolveAffordance` / `resolveFieldAffordance` / `formFieldsAffordance`) in a `readBy` file. */
  | { kind: 'mapped'; rows: ConsoleAffordance[]; readBy: string[]; note?: string }
  /** The body of a write helper — its callers are the sites. */
  | { kind: 'helper'; helper: string }
  /** The data door itself: a `DataSource` implementation or engine that runs the writes it is handed. */
  | { kind: 'door'; why: string }
  /** A write that is not a CRUD affordance on a record the caller browses. */
  | { kind: 'outOfFamily'; why: string }
  /** A write affordance with no map row yet — the backlog this census found, named one by one. */
  | { kind: 'unmapped'; why: string };

const mapped = (rows: ConsoleAffordance[], ...readBy: string[]): WriteSite => ({ kind: 'mapped', rows, readBy });
const helper = (name: string): WriteSite => ({ kind: 'helper', helper: name });
const door = (why: string): WriteSite => ({ kind: 'door', why });
const outOfFamily = (why: string): WriteSite => ({ kind: 'outOfFamily', why });
const unmapped = (why: string): WriteSite => ({ kind: 'unmapped', why });

const FIELD_WRITE_GATE = 'packages/plugin-form/src/fieldWriteGate.ts';
const DETAIL_VIEW = 'packages/plugin-detail/src/DetailView.tsx';
const OBJECT_GRID = 'packages/plugin-grid/src/ObjectGrid.tsx';
const RECORD_PAGE = 'packages/app-shell/src/views/RecordDetailView.tsx';
const RECORD_DETAILS = 'packages/plugin-detail/src/renderers/record-details.tsx';
const CONSOLE_LIST = 'packages/app-shell/src/views/ObjectView.tsx';
const LIST_VIEW = 'packages/plugin-list/src/ListView.tsx';

const OVERLAY_INLINE_EDIT =
  "the record overlay's inline field edit: `RecordDetailPanel` opens its inline-edit session on handler " +
  'PRESENCE alone (`canEdit={!!onFieldSave}`), so a caller without the update grant is offered the editors; ' +
  'the recordEdit row is the candidate';
const ADAPTER = 'a DataSource implementation: it runs the writes its callers hand it';

/**
 * Every write call site in the console tree, by `FILE :: SYMBOLS :: VERB`.
 * Written by hand from reading each site — NOT derived from the walk.
 */
const WRITE_SITES: Record<string, WriteSite> = {
  // ── app-shell ──
  'packages/app-shell/src/hooks/useConsoleActionRuntime.tsx :: useConsoleActionRuntime > apiHandler :: update':
    outOfFamily("an authored action's executor: the action declares the write, and its own visibility / permissions gate it"),
  'packages/app-shell/src/hooks/useObjectActions.ts :: useObjectActions :: delete':
    mapped(['rowDelete', 'listBulkDelete'], OBJECT_GRID, LIST_VIEW),
  'packages/app-shell/src/hooks/useUserLocale.ts :: useLanguageSelection :: update':
    outOfFamily("the language switcher changes the session's language locally and persists the caller's OWN sys_user.locale best-effort, a refusal surfacing as a toast"),
  'packages/app-shell/src/views/RecordAttachmentsPanel.tsx :: RecordAttachmentsPanel > handleFiles :: create':
    mapped(['attachmentUpload'], 'packages/app-shell/src/views/RecordAttachmentsPanel.tsx'),
  'packages/app-shell/src/views/RecordAttachmentsPanel.tsx :: RecordAttachmentsPanel > handleDelete :: delete':
    mapped(['attachmentDelete'], 'packages/app-shell/src/views/RecordAttachmentsPanel.tsx'),
  'packages/app-shell/src/views/RecordDetailView.tsx :: RecordDetailView > apiHandler :: update':
    outOfFamily("an authored action's executor on the record page: the action declares the write, and its own visibility / permissions gate it"),
  'packages/app-shell/src/views/RecordDetailView.tsx :: RecordDetailView > handleAddComment :: create':
    unmapped('the record feed\'s comment composer creates a sys_comment row and reads no grant on sys_comment'),
  'packages/app-shell/src/views/RecordDetailView.tsx :: RecordDetailView > handleAddReply :: create':
    unmapped('the record feed\'s reply composer creates a sys_comment row and reads no grant on sys_comment'),
  'packages/app-shell/src/views/RecordDetailView.tsx :: RecordDetailView > handleToggleReaction :: update':
    unmapped("the record feed's reaction toggle updates a sys_comment row and reads no grant on sys_comment"),
  'packages/app-shell/src/views/RecordDetailView.tsx :: RecordDetailView > onClick :: delete':
    mapped(['recordDelete'], RECORD_PAGE),
  'packages/app-shell/src/views/RelatedRecordActionsBridge.tsx :: RelatedRecordActionsBridge > value > resolve :: delete':
    mapped(['relatedRowDelete'], 'packages/app-shell/src/views/RelatedRecordActionsBridge.tsx'),
  'packages/app-shell/src/views/metadata-admin/AssignedUsersSection.tsx :: AssignedUsersSection > addUsers :: create':
    unmapped("Setup's permission-set assignment creates sys_user_permission_set rows and reads no grant on that object"),
  'packages/app-shell/src/views/metadata-admin/AssignedUsersSection.tsx :: AssignedUsersSection > removeUser :: delete':
    unmapped("Setup's permission-set assignment deletes sys_user_permission_set rows and reads no grant on that object"),
  // ── core ──
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > executeBatch :: batch':
    door('the action engine\'s transaction executor runs the operations its caller hands it'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > executeBatch :: create':
    door('the action engine\'s transaction executor runs the operations its caller hands it'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > executeBatch :: update':
    door('the action engine\'s transaction executor runs the operations its caller hands it'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > executeBatch :: delete':
    door('the action engine\'s transaction executor runs the operations its caller hands it'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > rollbackOperations :: delete':
    door('the transaction executor undoing its own batch'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > rollbackOperations :: update':
    door('the transaction executor undoing its own batch'),
  'packages/core/src/actions/TransactionManager.ts :: TransactionManager > rollbackOperations :: create':
    door('the transaction executor undoing its own batch'),
  'packages/core/src/actions/recordDelete.ts :: recordDelete > run :: delete': helper('recordDelete.run'),
  'packages/core/src/adapters/ApiDataSource.ts :: ApiDataSource > batchTransaction :: batch': door(ADAPTER),
  'packages/core/src/adapters/ValueDataSource.ts :: ValueDataSource > bulk :: create': door(ADAPTER),
  'packages/core/src/adapters/ValueDataSource.ts :: ValueDataSource > bulk :: update': door(ADAPTER),
  'packages/core/src/adapters/ValueDataSource.ts :: ValueDataSource > bulk :: delete': door(ADAPTER),
  'packages/core/src/adapters/ValueDataSource.ts :: ValueDataSource > batchTransaction :: batch': door(ADAPTER),
  'packages/core/src/adapters/batchTransaction.ts :: emulateBatchTransaction :: create': helper('emulateBatchTransaction'),
  'packages/core/src/adapters/batchTransaction.ts :: emulateBatchTransaction :: update': helper('emulateBatchTransaction'),
  'packages/core/src/adapters/batchTransaction.ts :: emulateBatchTransaction :: delete': helper('emulateBatchTransaction'),
  'packages/core/src/adapters/batchTransaction.ts :: runBatchTransaction :: batch': helper('runBatchTransaction'),
  // ── data-objectstack ──
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > create :: create': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > update :: update': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > delete :: delete': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > bulkUpdate :: update': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > bulkDelete :: delete': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > batchTransaction :: batch': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > fallbackToEmulation :: batch': door(ADAPTER),
  'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > bulk :: update': door(ADAPTER),
  'packages/data-objectstack/src/userState.ts :: createObjectStackUserStateAdapter > upsert :: update':
    outOfFamily("the caller's OWN per-user state rows (saved view state), written on the caller's behalf; no console affordance offers them as a record write"),
  'packages/data-objectstack/src/userState.ts :: createObjectStackUserStateAdapter > upsert :: create':
    outOfFamily("the caller's OWN per-user state rows (saved view state), written on the caller's behalf; no console affordance offers them as a record write"),
  // ── fields ──
  'packages/fields/src/widgets/LookupField.tsx :: LookupField > handleCreateNew :: create':
    mapped(['lookupCreateNew'], 'packages/fields/src/widgets/LookupField.tsx'),
  // ── mobile ──
  'packages/mobile/src/createOfflineDataSource.ts :: createOfflineDataSource > wrapped > replay :: create': door('the offline DataSource wrapper replaying its queue into the wrapped one'),
  'packages/mobile/src/createOfflineDataSource.ts :: createOfflineDataSource > wrapped > replay :: update': door('the offline DataSource wrapper replaying its queue into the wrapped one'),
  'packages/mobile/src/createOfflineDataSource.ts :: createOfflineDataSource > wrapped > replay :: delete': door('the offline DataSource wrapper replaying its queue into the wrapped one'),
  // ── plugin-calendar ──
  'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > handleEventDropDefault :: update':
    mapped(['calendarReschedule'], 'packages/plugin-calendar/src/ObjectCalendar.tsx'),
  'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > submitQuickCreate :: create':
    mapped(['calendarQuickCreate'], 'packages/plugin-calendar/src/ObjectCalendar.tsx'),
  'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > renderRecordOverlay > onFieldSave :: update':
    unmapped(OVERLAY_INLINE_EDIT),
  'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > renderRecordOverlay > onDelete :: delete':
    mapped(['recordDelete'], DETAIL_VIEW),
  // ── plugin-designer ──
  'packages/plugin-designer/src/pages/DashboardDesignPage.tsx :: DashboardDesignPage > saveSchema :: update':
    unmapped("the dashboard designer's Save updates a sys_dashboard row and reads no grant on sys_dashboard"),
  // ── plugin-detail ──
  'packages/plugin-detail/src/InlineEditSaveBar.tsx :: updateVia :: update':
    mapped(['recordEdit'], RECORD_PAGE, RECORD_DETAILS),
  'packages/plugin-detail/src/RelatedList.tsx :: RelatedList > handleAddRecords :: create':
    unmapped("a related list's Add existing (picker) creates a junction row and reads no grant on it"),
  'packages/plugin-detail/src/RelatedList.tsx :: RelatedList > handleAddRecords :: update':
    unmapped("a related list's Add existing (picker) re-parents the picked record and reads no update grant on it"),
  'packages/plugin-detail/src/renderers/record-related-list.tsx :: RecordRelatedListBody :: delete':
    unmapped("the related list's FALLBACK remove (an `add` config and no host handler mounted) deletes with no grant read; the host handler path is relatedRowDelete"),
  // ── plugin-form ──
  'packages/plugin-form/src/DrawerForm.tsx :: DrawerForm > handleSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/DrawerForm.tsx :: DrawerForm > handleSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/EmbeddableForm.tsx :: EmbeddableForm > handleSubmit :: create':
    outOfFamily('a public embeddable form submits with no signed-in principal, so there is no grant to read; the server\'s public-form policy decides'),
  'packages/plugin-form/src/LineItemsPanel.tsx :: LineItemsPanel > save :: batch':
    mapped(['relatedNew', 'relatedRowDelete', 'editFormFields'], 'packages/plugin-form/src/LineItemsPanel.tsx', FIELD_WRITE_GATE),
  'packages/plugin-form/src/MasterDetailForm.tsx :: MasterDetailForm > sendBatch :: batch':
    unmapped("the master's fields are behind the form rows (its header ObjectForm), but its line grids' add / remove read no child grant; relatedNew / relatedRowDelete are the candidates, except that a create-mode master's removed line is never a server delete"),
  'packages/plugin-form/src/ModalForm.tsx :: ModalForm > handleSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/ModalForm.tsx :: ModalForm > handleSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/ObjectForm.tsx :: SimpleObjectForm > handleSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/ObjectForm.tsx :: SimpleObjectForm > handleSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/SplitForm.tsx :: SplitForm > handleSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/SplitForm.tsx :: SplitForm > handleSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/TabbedForm.tsx :: TabbedForm > handleSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/TabbedForm.tsx :: TabbedForm > handleSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/WizardForm.tsx :: WizardForm > handleStepSubmit :: create': mapped(['createFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/WizardForm.tsx :: WizardForm > handleStepSubmit :: update': mapped(['editFormFields'], FIELD_WRITE_GATE),
  'packages/plugin-form/src/occSave.tsx :: useOccSave > saveWithOcc :: update': helper('saveWithOcc'),
  // ── plugin-gantt ──
  'packages/plugin-gantt/src/ObjectGantt.tsx :: ObjectGantt > handleTaskUpdateDefault :: update':
    unmapped("a gantt's drag / resize of a task bar writes its dates and reads no update grant (only `readOnly` and `lockField`)"),
  'packages/plugin-gantt/src/ObjectGantt.tsx :: ObjectGantt > persistDependencies :: update':
    unmapped("a gantt's dependency edit writes the dependencies field and reads no update grant"),
  'packages/plugin-gantt/src/ObjectGantt.tsx :: ObjectGantt > confirmDelete :: delete':
    unmapped("a gantt row kebab's Delete reads no delete grant"),
  'packages/plugin-gantt/src/ObjectGantt.tsx :: ObjectGantt > renderRecordOverlay :: update': unmapped(OVERLAY_INLINE_EDIT),
  'packages/plugin-gantt/src/ObjectGantt.tsx :: ObjectGantt > renderRecordOverlay :: delete': mapped(['recordDelete'], DETAIL_VIEW),
  // ── plugin-grid ──
  'packages/plugin-grid/src/ImportWizard.tsx :: ImportWizard > legacyImport :: create': {
    ...mapped(['listImport'], CONSOLE_LIST, 'packages/app-shell/src/views/importTargetFields.ts'),
    note: "the console list's Import; the AI build panel's spreadsheet import (`ExcelImportBar`) mounts the same wizard with no grant read",
  } as WriteSite,
  'packages/plugin-grid/src/ObjectGrid.tsx :: ObjectGrid > defaultRowSave :: update': mapped(['listInlineEdit'], OBJECT_GRID),
  'packages/plugin-grid/src/ObjectGrid.tsx :: ObjectGrid > defaultBatchSave :: update': mapped(['listInlineEdit'], OBJECT_GRID),
  'packages/plugin-grid/src/hooks/useBulkExecutor.ts :: useBulkExecutor > run > perRow :: delete': mapped(['rowDelete'], OBJECT_GRID),
  'packages/plugin-grid/src/hooks/useBulkExecutor.ts :: useBulkExecutor > run > perRow :: update':
    unmapped("a grid's bulk field update (a `bulkActionDefs` update operation) reads no update grant; only its delete operation rides the rowDelete verdict"),
  'packages/plugin-grid/src/hooks/useBulkExecutor.ts :: useBulkExecutor > undo :: update':
    unmapped("the undo of a grid bulk field update, the inverse of that unmapped write"),
  'packages/plugin-grid/src/hooks/useBulkExecutor.ts :: useBulkExecutor > retry :: delete': mapped(['rowDelete'], OBJECT_GRID),
  'packages/plugin-grid/src/hooks/useBulkExecutor.ts :: useBulkExecutor > retry :: update':
    unmapped("the retry of a grid bulk field update, that same unmapped write"),
  // ── plugin-kanban ──
  'packages/plugin-kanban/src/ObjectKanban.tsx :: ObjectKanban > persistCardMove :: update':
    mapped(['kanbanCardMove'], 'packages/plugin-kanban/src/ObjectKanban.tsx'),
  'packages/plugin-kanban/src/ObjectKanban.tsx :: ObjectKanban > renderRecordOverlay > onFieldSave :: update':
    unmapped(OVERLAY_INLINE_EDIT),
  'packages/plugin-kanban/src/ObjectKanban.tsx :: ObjectKanban > renderRecordOverlay > onDelete :: delete':
    mapped(['recordDelete'], DETAIL_VIEW),
  // ── plugin-view ──
  'packages/plugin-view/src/ObjectView.tsx :: ObjectView > onClick :: delete':
    mapped(['rowDelete'], OBJECT_GRID),
  // ── react ──
  'packages/react/src/hooks/useGlobalUndo.ts :: executeOp :: delete':
    outOfFamily('the global undo / redo stack replays the inverse of a write the caller just made through an affordance; it offers no write of its own'),
  'packages/react/src/hooks/useGlobalUndo.ts :: executeOp :: update':
    outOfFamily('the global undo / redo stack replays the inverse of a write the caller just made through an affordance; it offers no write of its own'),
  'packages/react/src/hooks/useGlobalUndo.ts :: executeOp :: create':
    outOfFamily('the global undo / redo stack replays the inverse of a write the caller just made through an affordance; it offers no write of its own'),
  // ── runner ──
  'packages/runner/src/lib/mockDataSource.ts :: MockDataSource > batchTransaction :: batch': door(ADAPTER),
  // ── console ──
  'apps/console/src/pages/system/ProfilePage.tsx :: LanguageCard > handleSave :: update':
    mapped(['editFormFields'], 'apps/console/src/pages/system/ProfilePage.tsx'),
};

const isFn = (e: ts.Node | undefined): boolean => !!e && (ts.isArrowFunction(e) || ts.isFunctionExpression(e));

/** Does this initializer open a named scope — a function, or an object / call carrying one? */
function opensScope(init: ts.Node | undefined): boolean {
  if (!init) return false;
  if (isFn(init) || ts.isObjectLiteralExpression(init)) return true;
  if (ts.isParenthesizedExpression(init) || ts.isAsExpression(init) || ts.isSatisfiesExpression(init)) return opensScope(init.expression);
  if (ts.isCallExpression(init)) return init.arguments.some((a) => isFn(a) || ts.isObjectLiteralExpression(a));
  return false;
}

function scopeName(n: ts.Node, sf: ts.SourceFile): string | null {
  if ((ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isClassDeclaration(n)) && n.name) return n.name.getText(sf);
  if ((ts.isVariableDeclaration(n) || ts.isPropertyAssignment(n) || ts.isPropertyDeclaration(n)) && ts.isIdentifier(n.name) && opensScope(n.initializer)) {
    return n.name.text;
  }
  if (ts.isJsxAttribute(n) && n.initializer && ts.isJsxExpression(n.initializer) && isFn(n.initializer.expression)) return n.name.getText(sf);
  return null;
}

/** The write sites in one source text, and the map rows it reads. */
function scanWrites(rel: string, text: string): { sites: Set<string>; rowsRead: Set<string> } {
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, false, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const sites = new Set<string>();
  const rowsRead = new Set<string>();
  const visit = (n: ts.Node, chain: string[]): void => {
    const name = scopeName(n, sf);
    const here = name ? [...chain, name] : chain;
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const calleeText = callee.getText(sf);
      let verb: Verb | undefined = WRITE_HELPERS[calleeText];
      if (!verb && ts.isPropertyAccessExpression(callee)) {
        const member = MEMBER_WRITES.get(callee.name.text);
        if (member && n.arguments.length >= member.arity) verb = member.verb;
      }
      if (verb) sites.add(`${rel} :: ${here.join(' > ') || '(module)'} :: ${verb}`);
      const first = n.arguments[0];
      if ((calleeText === 'resolveAffordance' || calleeText === 'resolveFieldAffordance') && first && ts.isStringLiteralLike(first)) {
        rowsRead.add(first.text);
      }
      if (calleeText === 'formFieldsAffordance') {
        rowsRead.add('createFormFields');
        rowsRead.add('editFormFields');
      }
    }
    ts.forEachChild(n, (c) => visit(c, here));
  };
  visit(sf, []);
  return { sites, rowsRead };
}

function writeCensus(): { sites: Set<string>; rowsReadBy: Map<string, Set<string>> } {
  const sites = new Set<string>();
  const rowsReadBy = new Map<string, Set<string>>();
  for (const file of consoleSources()) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    const scanned = scanWrites(rel, readFileSync(file, 'utf8'));
    for (const s of scanned.sites) sites.add(s);
    if (scanned.rowsRead.size) rowsReadBy.set(rel, scanned.rowsRead);
  }
  return { sites, rowsReadBy };
}

describe('the write census: every write call site sits behind a map row, or says why not (objectui#12082)', () => {
  const { sites, rowsReadBy } = writeCensus();

  it('CONTROL — the recognizer fires on each shape, and not on a collection\'s delete(key)', () => {
    const { sites: found, rowsRead } = scanWrites(
      'pin/probe.tsx',
      [
        'async function save(ds: any, m: Map<string, number>, ops: any[]) {',
        "  await ds.update('o', '1', { a: 1 });",
        '  m.delete("k");',
        '  await runBatchTransaction(ds, ops);',
        '}',
        "const Panel = () => <List onDelete={async () => { await (ds as any).delete?.('o', '1'); }} />;",
        'const api = { remove: async () => recordDelete.run(deps, action) };',
        "const ok = resolveAffordance('rowEdit', source);",
      ].join('\n'),
    );
    expect([...found].sort()).toEqual([
      'pin/probe.tsx :: Panel > onDelete :: delete',
      'pin/probe.tsx :: api > remove :: delete',
      'pin/probe.tsx :: save :: batch',
      'pin/probe.tsx :: save :: update',
    ]);
    expect([...rowsRead]).toEqual(['rowEdit']);
  });

  it('CONTROL — the walk reached the data door and the five sites the card names', () => {
    for (const key of [
      'packages/data-objectstack/src/index.ts :: ObjectStackAdapter > update :: update',
      'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > submitQuickCreate :: create',
      'packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > handleEventDropDefault :: update',
      'packages/plugin-kanban/src/ObjectKanban.tsx :: ObjectKanban > persistCardMove :: update',
      'packages/plugin-form/src/LineItemsPanel.tsx :: LineItemsPanel > save :: batch',
    ]) {
      expect(sites.has(key), key).toBe(true);
    }
  });

  it('every write site in the tree has an entry, and every entry is a site in the tree', () => {
    const unlisted = [...sites].filter((k) => !(k in WRITE_SITES)).sort();
    const gone = Object.keys(WRITE_SITES).filter((k) => !sites.has(k)).sort();
    expect(
      { unlisted, gone },
      'A write call site has no WRITE_SITES entry (unlisted), or an entry no longer matches a site (gone). ' +
        "For a new write affordance, give it a row in AFFORDANCE_GRANTS in @object-ui/core, read it through " +
        'resolveAffordance where the affordance is offered, and enter the site here as `mapped`. A write that is ' +
        'not a CRUD affordance is entered with the reason. A renamed handler moves its key: re-read the site and ' +
        'move its entry.',
    ).toEqual({ unlisted: [], gone: [] });
  });

  it('every mapped site names rows of the map, of its own verb, each read by one of the files it names', () => {
    const problems: string[] = [];
    for (const [key, site] of Object.entries(WRITE_SITES)) {
      if (site.kind !== 'mapped') continue;
      const verb = key.slice(key.lastIndexOf(' :: ') + 4) as Verb;
      for (const row of site.rows) {
        if (!(row in AFFORDANCE_GRANTS)) {
          problems.push(`${key}: ${row} is not a row of the map`);
          continue;
        }
        const grant = AFFORDANCE_GRANTS[row].grant;
        if (verb !== 'batch' && grant !== verb) problems.push(`${key}: ${row} reads the ${grant} grant for a ${verb}`);
        if (!site.readBy.some((f) => rowsReadBy.get(f)?.has(row))) {
          problems.push(`${key}: no file it names reads ${row}`);
        }
      }
      for (const f of site.readBy) {
        if (!site.rows.some((row) => rowsReadBy.get(f)?.has(row))) problems.push(`${key}: ${f} reads none of its rows`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('the write helpers and their entries name each other', () => {
    const named = new Set(
      Object.values(WRITE_SITES).flatMap((site) => (site.kind === 'helper' ? [site.helper] : [])),
    );
    expect([...named].sort()).toEqual(Object.keys(WRITE_HELPERS).sort());
  });

  it("the card's five: each sits behind its own row, read where the affordance is offered", () => {
    const behind = (key: string) => {
      const site = WRITE_SITES[key];
      return site?.kind === 'mapped' ? site.rows : [];
    };
    expect(behind('packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > submitQuickCreate :: create')).toEqual(['calendarQuickCreate']);
    expect(behind('packages/plugin-calendar/src/ObjectCalendar.tsx :: ObjectCalendar > handleEventDropDefault :: update')).toEqual(['calendarReschedule']);
    expect(behind('packages/plugin-kanban/src/ObjectKanban.tsx :: ObjectKanban > persistCardMove :: update')).toEqual(['kanbanCardMove']);
    expect(behind('packages/plugin-form/src/LineItemsPanel.tsx :: LineItemsPanel > save :: batch')).toEqual(
      expect.arrayContaining(['relatedNew', 'relatedRowDelete']),
    );
    // The object-view New leads to a write (it opens a create form) rather than
    // issuing one, so it is read where it is offered, not counted as a site.
    expect(rowsReadBy.get('packages/plugin-view/src/ObjectView.tsx')?.has('listNew')).toBe(true);
  });
});
