/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8071 slice 12 — the MEMBER shape `object-grid` reads inside
 * `operations`.
 *
 * ## What the registration cannot say
 *
 * `operations` is registered as an OBJECT-armed input. The arm says nothing
 * about which members are read, and the three that ARE read do not behave
 * alike: `update` and `delete` gate the row kebab's generic entries, `export`
 * gates the toolbar button — and the two halves carry OPPOSITE defaults once
 * the block is present at all. That asymmetry is invisible from the
 * registration, invisible from `ObjectGridSchema`, and is the thing an author
 * writing `operations: { export: false }` actually needs to know.
 *
 * ## The member facts pinned here, and why each is at the row rather than at a prop
 *
 *  1. **Presence REPLACES, it does not merge.** An authored block is taken
 *     whole: `{}` means "update: absent, delete: absent" and CLOSES both, even
 *     with `onEdit` / `onDelete` wired. Omitting the key entirely takes the
 *     wired-callback default instead. Merging the default UNDER the authored
 *     block (`{ ...defaults, ...authored }`) is the plausible simplification
 *     this file refuses: it reads identically on every schema that names
 *     `update`/`delete`, and silently re-opens generic Edit/Delete for every
 *     author who declared a block naming neither.
 *  2. **`update` and `delete` are independent**, not one write flag.
 *  3. **They are a UNION with `rowActions`' canonical names, never an
 *     intersection** — `operations: { update: false }` cannot close what
 *     `rowActions: ['edit']` opened. Pinned because the opposite reading is the
 *     natural one for a key spelled like a permission block.
 *  4. **Neither member is a grant.** Without the consumer's callback the
 *     affordance stays closed whatever the block says.
 *  5. **`export` defaults the OTHER WAY inside a present block** — omitted
 *     means allowed, and only an explicit `false` closes it.
 *
 * Every row-kebab claim is read out of an OPENED menu on a rendered row.
 * "The prop was computed" is green against a grid that draws the entry anyway,
 * which is the failure this key exists to prevent.
 *
 * Prior art, stated so this file is not read as the first word on the key:
 * `exportGate.test.tsx` already covers fact 5's three cases on their own;
 * `rowCrudEffectiveOps.test.tsx` and `rowOperationsPerRow-8674.test.tsx` cover
 * the layers ANDed on TOP of this key (the ADR-0103 bucket, `userActions`, the
 * server's effective operation set, the per-row predicate). None of them states
 * facts 1-4, which are the key's own members.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

import { ObjectGrid } from '../ObjectGrid';
import { __clearRecordCrudVerdictCache } from '../hooks/useRecordCrudVerdicts';
import { installExplainDouble } from './explainDouble';
import { registerAllFields } from '@object-ui/fields';
import { ActionProvider } from '@object-ui/react';

registerAllFields();

const ROWS = [{ id: 'r1', name: 'Alice' }];

interface Case {
  /** Omitted from the schema entirely when absent — the key's own absence. */
  operations?: Record<string, boolean>;
  rowActions?: string[];
  exportOptions?: Record<string, unknown>;
  /** Both callbacks are wired unless a case says otherwise. */
  wireCallbacks?: boolean;
}

function renderGrid(c: Case = {}) {
  const wire = c.wireCallbacks !== false;
  const schema: any = {
    type: 'object-grid',
    objectName: 'test_object',
    columns: [{ field: 'name', label: 'Name' }],
    data: { provider: 'value', items: ROWS },
    ...(c.operations ? { operations: c.operations } : {}),
    ...(c.rowActions ? { rowActions: c.rowActions } : {}),
    ...(c.exportOptions ? { exportOptions: c.exportOptions } : {}),
  };
  return render(
    <ActionProvider>
      <ObjectGrid
        schema={schema}
        {...(wire ? { onEdit: vi.fn(), onDelete: vi.fn() } : {})}
      />
    </ActionProvider>,
  );
}

/**
 * What the row's kebab offers.
 *
 * Located through the row, because a row refused everything grows no "⋮"
 * trigger at all (#3562) — indexing a global list of triggers would silently
 * address nothing once the gate works, and read as a pass.
 */
async function rowKebab(): Promise<{ trigger: boolean; edit: boolean; delete: boolean }> {
  const row = screen.getByText('Alice').closest('tr');
  const trigger = row?.querySelector('[data-testid="row-action-trigger"]');
  if (!trigger) return { trigger: false, edit: false, delete: false };
  await userEvent.click(trigger);
  const answer = {
    trigger: true,
    edit: screen.queryAllByTestId('row-action-builtin-edit').length > 0,
    delete: screen.queryAllByTestId('row-action-builtin-delete').length > 0,
  };
  await userEvent.keyboard('{Escape}');
  return answer;
}

async function settle() {
  await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
}

beforeEach(() => {
  __clearRecordCrudVerdictCache();
  installExplainDouble();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('object-grid `operations` — an authored block REPLACES the wired-callback default', () => {
  it('CONTROL — with the key absent, the wired callbacks alone open both generic entries', async () => {
    renderGrid();
    await settle();
    expect(await rowKebab()).toEqual({ trigger: true, edit: true, delete: true });
  });

  it('an EMPTY authored block closes both, on the same data and the same callbacks', async () => {
    renderGrid({ operations: {} });
    await settle();
    // Not "one entry fewer": a row with nothing left to offer grows no kebab.
    expect(await rowKebab()).toEqual({ trigger: false, edit: false, delete: false });
  });

  it('a block naming only `export` still closes the two it does not name', async () => {
    // The shape an author actually writes when they mean "no exporting".
    // Under a merge it would keep Edit and Delete from the default — the same
    // fields, the same callbacks, an author who asked to close one door and
    // left two open without being told.
    renderGrid({ operations: { export: false } });
    await settle();
    expect(await rowKebab()).toEqual({ trigger: false, edit: false, delete: false });
  });
});

describe('object-grid `operations` — `update` and `delete` are read independently', () => {
  it('`update: true, delete: false` offers Edit and withholds Delete', async () => {
    renderGrid({ operations: { update: true, delete: false } });
    await settle();
    expect(await rowKebab()).toEqual({ trigger: true, edit: true, delete: false });
  });

  it('`update: false, delete: true` is the mirror', async () => {
    renderGrid({ operations: { update: false, delete: true } });
    await settle();
    expect(await rowKebab()).toEqual({ trigger: true, edit: false, delete: true });
  });
});

describe('object-grid `operations` — neither member is a grant, and neither can close what `rowActions` opened', () => {
  it('`update`/`delete` true with NO callbacks wired offers nothing', async () => {
    renderGrid({ operations: { update: true, delete: true }, wireCallbacks: false });
    await settle();
    expect(await rowKebab()).toEqual({ trigger: false, edit: false, delete: false });
  });

  it('a UNION with `rowActions`: `update: false` does not survive `rowActions: [edit]`', async () => {
    renderGrid({ operations: { update: false, delete: false }, rowActions: ['edit'] });
    await settle();
    // The canonical name in `rowActions` re-opens Edit, while `delete` — named
    // in neither place — stays closed. An author reading `operations` as a
    // permission block would predict the opposite for both.
    expect(await rowKebab()).toEqual({ trigger: true, edit: true, delete: false });
  });
});

describe('object-grid `operations` — `export` is read at a different site with the opposite default', () => {
  it('a present block that does NOT name `export` still offers the export button', async () => {
    renderGrid({ operations: { update: false, delete: false }, exportOptions: { formats: ['csv'] } });
    await settle();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('only an explicit `export: false` closes it', async () => {
    renderGrid({ operations: { export: false }, exportOptions: { formats: ['csv'] } });
    await settle();
    expect(screen.queryAllByRole('button', { name: /export/i })).toHaveLength(0);
  });

  it('THE ASYMMETRY, in one statement: the same omission closes `update` and opens `export`', async () => {
    renderGrid({ operations: { somethingElse: true } as any, exportOptions: { formats: ['csv'] } });
    await settle();
    // One block, one omission each, two opposite answers.
    expect(await rowKebab()).toEqual({ trigger: false, edit: false, delete: false });
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });
});
