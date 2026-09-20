/**
 * objectui#10117 — `page:header` crashed with React #31 ("Objects are not
 * valid as a React child") when the record's declared name field was empty.
 *
 * ## The defect, in one sentence
 *
 * `PageHeaderRenderer`'s record-chrome branch asks the unified ADR-0079
 * resolver (`getRecordDisplayName`) with `deriveFromRecordKeys: false`, and
 * then RE-SPELLS that resolver's skipped record-key rung itself as a raw
 * `data?.name || data?.full_name || data?.title || data?.subject || …` chain.
 * Raw `||` reads the field's stored value, so for a `lookup` the truthy value
 * is the EXPANDED REFERENCE OBJECT — which went straight into JSX.
 *
 * ⭐ The control that proves the resolution already exists in this tree: the
 * breadcrumb resolves the SAME record through `getRecordDisplayName` WITHOUT
 * `deriveFromRecordKeys: false`, so its record-key rung runs through
 * `recordDisplayValueAt` -> `displayNameOfEmbeddedObject` and shows the
 * lookup's display name. The header did not crash for want of a resolver; it
 * crashed for having a second, raw copy of the walk.
 *
 * `recordDisplayValueAt`'s own header (objectui#8350) already ruled this
 * class: "Do not re-spell this test at a call site". This header was the
 * remaining re-spelling.
 *
 * ## What each pin holds
 *
 *  1. THE CRASH — empty `name` + a lookup candidate must not throw.
 *  2. THE DISPLAY NAME — the resolved lookup name must be ON SCREEN. A pin
 *     that only asserted "did not throw" passes on a header rendering
 *     `[object Object]`, so absence-of-throw is deliberately NOT the assertion.
 *  3. THE DEGRADE — a declared-but-empty name field degrades to the
 *     placeholder floor, never to a different field's raw value.
 *  4. THE CONTROL — a non-empty `name` still renders its own name, unchanged.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { ActionProvider, RecordContextProvider } from '@object-ui/react';

/**
 * The card's repro object: `kpi_entry_sheet` declares `nameField: 'name'`
 * over a readonly text field, and carries a required `subject` lookup to
 * `sys_business_unit`. An admin-created record never gets its hook-computed
 * `name`, so the declared field is empty while `subject` is expanded.
 */
const KPI_ENTRY_SHEET = {
  name: 'kpi_entry_sheet',
  label: 'KPI Entry Sheet',
  nameField: 'name',
  fields: {
    name: { type: 'text', label: 'Name', readonly: true },
    subject: { type: 'lookup', label: 'Subject', reference_to: 'sys_business_unit', required: true },
    subject_type: { type: 'text', label: 'Subject Type' },
  },
};

/** The expanded lookup payload from the card's `args[]`, keys and all. */
const EXPANDED_BUSINESS_UNIT = {
  id: 'bu_east',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  created_by: 'u_1',
  updated_by: 'u_1',
  name: '华东分公司',
  code: 'BU-EAST',
  kind: 'department',
  parent_business_unit_id: null,
  organization_id: 'org_1',
  manager_user_id: 'u_9',
  active: true,
  effective_from: '2026-01-01',
  effective_to: null,
  external_ref: null,
};

function PageHeader({ schema }: { schema: any }) {
  const Component = ComponentRegistry.get('page:header');
  if (!Component) throw new Error('page:header not registered');
  // eslint-disable-next-line react-hooks/static-components -- ComponentRegistry.get returns a registered component (stable), not one created during render
  return <Component schema={schema} />;
}

function renderHeader(opts: { record: any; objectSchema: any; schema?: any }) {
  return render(
    <ActionProvider>
      <RecordContextProvider
        objectName={opts.objectSchema?.name ?? 'kpi_entry_sheet'}
        recordId={opts.record?.id ?? null}
        data={opts.record}
        objectSchema={opts.objectSchema}
      >
        <PageHeader schema={opts.schema ?? { type: 'page:header' }} />
      </RecordContextProvider>
    </ActionProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('page:header — an empty declared name field must not reach for a lookup (objectui#10117)', () => {
  it('1. does not crash when the declared name field is empty and a lookup candidate is expanded', () => {
    // React logs the #31 invariant through console.error before throwing;
    // silence it so a genuine failure is read from the assertion, not noise.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderHeader({
        objectSchema: KPI_ENTRY_SHEET,
        record: {
          id: 'kes_0001',
          name: null,
          plan: 'FY26-Q3',
          subject: EXPANDED_BUSINESS_UNIT,
          subject_type: 'department',
        },
      }),
    ).not.toThrow();
  });

  it('2. renders the lookup DISPLAY NAME, not the object and not `[object Object]`', () => {
    renderHeader({
      objectSchema: {
        ...KPI_ENTRY_SHEET,
        // No declared name field: the record-key rung is the live path here,
        // which is exactly the rung the breadcrumb resolves correctly.
        nameField: undefined,
        fields: { subject: KPI_ENTRY_SHEET.fields.subject },
      },
      record: { id: 'kes_0002', subject: EXPANDED_BUSINESS_UNIT },
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('华东分公司');
    // The two shapes the defect produced, both asserted absent by name.
    expect(heading.textContent).not.toContain('[object Object]');
    expect(heading.textContent).not.toContain('parent_business_unit_id');
  });

  it('3. an empty DECLARED name field degrades to the placeholder floor, never to another field', () => {
    renderHeader({
      objectSchema: KPI_ENTRY_SHEET,
      record: {
        id: 'kes_0003',
        name: '   ',
        subject: EXPANDED_BUSINESS_UNIT,
        subject_type: 'department',
      },
    });

    const heading = screen.getByRole('heading', { level: 1 });
    // The floor is `${objectLabel} ${id-prefix}` — the header's own last
    // resort. What matters is that the OTHER field's value is not borrowed.
    expect(heading.textContent).not.toContain('华东分公司');
    expect(heading.textContent).not.toContain('[object Object]');
    expect(heading.textContent).toContain('kes_0003');
  });

  it('4. CONTROL — a record with a non-empty name still renders its own name', () => {
    renderHeader({
      objectSchema: KPI_ENTRY_SHEET,
      record: {
        id: 'kes_0004',
        name: 'FY26-Q3 East',
        subject: EXPANDED_BUSINESS_UNIT,
        subject_type: 'department',
      },
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('FY26-Q3 East');
    expect(heading.textContent).not.toContain('华东分公司');
  });
});
