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
// tests, stories and declaration files excluded, with comments stripped. The
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

/** Block comments (JSX ones included), then line comments. */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function census(): Map<string, number> {
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
  const hits = new Map<string, number>();
  for (const file of roots.flatMap((r) => sourcesUnder(r))) {
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
