/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `record:details`' dedupe must not hide a row when the H1 is an interpolated
 * `titleFormat` that names no single field (objectui#8351, ruled option B).
 *
 * ## The surface under test is the DEDUPE, not the title
 *
 * Same boundary as `record-details.nameFieldDedupe-8175.test.tsx`: this
 * renderer draws the body grid, never the H1. Every case below therefore
 * asserts which row RENDERS and which row DROPS.
 *
 * ## The defect
 *
 * The ladder is keyed on "which single FIELD is the H1 showing". A
 * `titleFormat` rung answers with a rendered TEMPLATE, which on a multi-field
 * format is no field's value at all. The ladder had no rung for it, so it
 * walked straight on to `resolveNameField` and hid THAT row — a row whose
 * value the H1 was not showing. The field simply vanished from the grid, and
 * nothing errored.
 *
 * ## What "fully interpolates" is measured against (objectui#8351 ZONE 2)
 *
 * Not a new predicate. The ladder asks `formatTitleTemplate` — the SAME
 * function `getRecordDisplayName`'s step 3 and this package's own
 * `DetailView.resolveDisplayTitle` step 2 call — for the title the template
 * renders on THIS record, and then asks `recordDisplayValueAt` whether that
 * string IS some candidate's value:
 *
 *   - renders a composite (no candidate's value equals it) -> hide NOTHING.
 *     That is the ruled case: "the H1 is not any single field's value, so
 *     there is no row to hide".
 *   - renders nothing (no placeholder resolved) -> the header has already
 *     walked past the template rung, so the ladder runs unchanged.
 *   - collapses onto ONE field's value (a blank placeholder was dropped, or
 *     the format names a single field) -> that row IS the duplicate the
 *     dedupe exists for, and it still goes.
 *
 * The last two are the lit controls: a rule that suppressed the dedupe on the
 * mere PRESENCE of a resolving `titleFormat` prints "Contract No: HT-2026-003"
 * directly under an H1 reading `HT-2026-003`, which is the exact duplication
 * Phase P.0 of the ladder exists to remove.
 *
 * ⛔ Out of scope by the same ruling: `page:header`'s own `schema.title`, which
 * this package cannot see, and the ORDER in which `PageHeaderRenderer` ranks
 * `titleFormat` against the ADR-0079 pointer (its own card).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as React from 'react';
import { RecordContextProvider } from '@object-ui/react';
import { RecordDetailsRenderer } from '../record-details';

/**
 * An object that declares BOTH a `nameField` and a two-field `titleFormat`.
 * The two answer differently on every record below, so "which row is hidden"
 * is answerable from the DOM alone.
 */
const contractSchema = {
  name: 'contract',
  label: 'Contract',
  nameField: 'contract_no',
  titleFormat: '{contract_no} - {name}',
  fields: {
    contract_no: { type: 'text', label: 'Contract No' },
    name: { type: 'text', label: 'Name' },
    amount: { type: 'number', label: 'Amount' },
  },
};

const CONTRACT_FIELDS = ['contract_no', 'name', 'amount'];

function renderBody(record: any, schema: any, fields: string[]) {
  return render(
    <RecordContextProvider
      objectName={schema?.name ?? 'contract'}
      recordId={record.id}
      data={record}
      objectSchema={schema}
    >
      <RecordDetailsRenderer schema={{ fields } as never} />
    </RecordContextProvider>,
  );
}

beforeEach(() => {
  // `useRecordEditable` probes `POST /api/v1/security/explain` for the
  // ROW-level verdict; happy-dom resolves that relative URL to a REAL socket,
  // which the repo's network-escape guard fails the file for (objectui#6640).
  // Serve it from a double — its answer is orthogonal to which row is hidden.
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ allowed: true }),
    text: async () => '{"allowed":true}',
  })) as never);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('record:details dedupe — an interpolated `titleFormat` hides no row (#8351)', () => {
  /**
   * The halves are separate cases ON PURPOSE, exactly as in the objectui#8175
   * pin: asserting both inside one `it` lets the first failure short-circuit
   * the second, so an ablation of the read site reddens one half and says
   * nothing at all about the other.
   */
  it('HALF 1 — KEEPS the declared `nameField` row (the H1 is not its value)', () => {
    renderBody(
      { id: 'C1', contract_no: 'HT-2026-001', name: 'Acme Corporation', amount: 42 },
      contractSchema,
      CONTRACT_FIELDS,
    );

    // The H1 for this record reads `HT-2026-001 - Acme Corporation`. It is not
    // `contract_no`'s value, so `contract_no` duplicates no heading — and the
    // ladder used to hide it anyway, because `resolveNameField` names it.
    expect(screen.getByText('HT-2026-001')).toBeInTheDocument();

    // CONTROL — the grid rendered at all. Without it a build that rendered
    // nothing would satisfy nothing here, and `queryByText === null` cases
    // below are trivially true on an empty document.
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('HALF 2 — KEEPS the ordinary `name` row too (the template names no ONE field)', () => {
    renderBody(
      { id: 'C1', contract_no: 'HT-2026-001', name: 'Acme Corporation', amount: 42 },
      contractSchema,
      CONTRACT_FIELDS,
    );

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();

    // CONTROL — the grid rendered at all.
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('LIT CONTROL A — a `titleFormat` that resolves to NOTHING leaves the ladder alone', () => {
    // No placeholder resolves on this record, so `formatTitleTemplate` returns
    // '' and the header has already walked PAST the template rung onto the
    // declared pointer. The H1 reads `HT-2026-002`, and that row must still go.
    renderBody(
      { id: 'C2', contract_no: 'HT-2026-002', name: 'internal-name', amount: 7 },
      { ...contractSchema, titleFormat: '{ref_a} - {ref_b}' },
      CONTRACT_FIELDS,
    );

    expect(screen.queryByText('HT-2026-002')).toBeNull();
    expect(screen.getByText('internal-name')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // CONTROL: grid rendered
  });

  it('LIT CONTROL B — a template that COLLAPSES onto one field still hides that row', () => {
    // `name` is blank, so `formatTitleTemplate` drops that placeholder and the
    // orphan separator with it: the H1 reads exactly `HT-2026-003`. That IS
    // `contract_no`'s value, so the row is a real duplicate and still goes.
    // This is the case a presence-only rule gets wrong — it would print
    // "Contract No: HT-2026-003" directly under an identical H1.
    renderBody(
      { id: 'C3', contract_no: 'HT-2026-003', name: '', amount: 9 },
      contractSchema,
      CONTRACT_FIELDS,
    );

    expect(screen.queryByText('HT-2026-003')).toBeNull();
    expect(screen.getByText('9')).toBeInTheDocument(); // CONTROL: grid rendered
  });

  it('LIT CONTROL C — a single-field `titleFormat` is that field, and still dedupes', () => {
    // `{name}` renders exactly `name`'s value. "Interpolated" does not mean
    // "composite": the ruled reason is that the H1 names no ONE field, and
    // here it names exactly one.
    renderBody(
      { id: 'C4', name: 'Acme Corporation', amount: 5 },
      {
        name: 'plain',
        label: 'Plain',
        titleFormat: '{name}',
        fields: {
          name: { type: 'text', label: 'Name' },
          amount: { type: 'number', label: 'Amount' },
        },
      },
      ['name', 'amount'],
    );

    expect(screen.queryByText('Acme Corporation')).toBeNull();
    expect(screen.getByText('5')).toBeInTheDocument(); // CONTROL: grid rendered
  });

  it('hides the row the TEMPLATE names, not the one the declared pointer names', () => {
    // `titleFormat` is `{name}` while `nameField` points at `contract_no`. The
    // H1 reads `Acme Corporation`. The ladder's first candidate WITH A VALUE
    // is `contract_no` — so a walk that stops at the first resolving candidate
    // hides `HT-2026-005`, a row the H1 never showed, and leaves the real
    // duplicate printed underneath. Both halves wrong at once, the objectui#8175
    // shape one rung further along.
    renderBody(
      { id: 'C5', contract_no: 'HT-2026-005', name: 'Acme Corporation', amount: 3 },
      { ...contractSchema, titleFormat: '{name}' },
      CONTRACT_FIELDS,
    );

    expect(screen.queryByText('Acme Corporation')).toBeNull();
    expect(screen.getByText('HT-2026-005')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // CONTROL: grid rendered
  });

  it('CONTROL — an object with NO `titleFormat` dedupes exactly as before', () => {
    // The objectui#8175 ladder, untouched. Without this case, a change that
    // disabled the H1 dedupe outright would pass every assertion above.
    renderBody(
      { id: 'C6', contract_no: 'HT-2026-006', name: 'internal-name', amount: 11 },
      { ...contractSchema, titleFormat: undefined },
      CONTRACT_FIELDS,
    );

    expect(screen.queryByText('HT-2026-006')).toBeNull();
    expect(screen.getByText('internal-name')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument(); // CONTROL: grid rendered
  });
});
