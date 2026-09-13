/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9113 — the THIRD of the three collapsing renderers, measured.
 *
 * The instrument, the reasoning behind it and the question-1 portability
 * probe live in
 * `plugin-gantt/src/ObjectGantt.overlayShellCollapse-9113.test.tsx`; the LIVE
 * CONTROL is `plugin-tree/src/ObjectTree.overlayShellControl-9113.test.tsx`,
 * which reads FOUR distinct boundary pairs off the identical technique.
 *
 * ⛔ MEASUREMENT, NOT REPAIR. Nothing here votes for a remedy.
 *
 * ⚠️ One difference from its two siblings is worth recording rather than
 * smoothing over: `ObjectCalendar` reads the key off `(schema as any)`, so —
 * unlike gantt and kanban — the authored `navigation` is not even declared on
 * this renderer's schema type. The collapse measured below is downstream of
 * that and independent of it.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const hookLog = vi.hoisted(() => ({
  calls: [] as Array<{ mode: string; isOverlay: boolean }>,
}));

const shellLog = vi.hoisted(() => ({
  entries: [] as Array<{ shell: string; mode: unknown; carriesMode: boolean; propValues: unknown[] }>,
}));

vi.mock('@object-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/react')>();
  return {
    ...actual,
    useNavigationOverlay: (options: any) => {
      const state = actual.useNavigationOverlay(options);
      hookLog.calls.push({ mode: state.mode, isOverlay: state.isOverlay });
      return state;
    },
  };
});

vi.mock('@object-ui/plugin-detail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/plugin-detail')>();
  return {
    ...actual,
    RecordDetailDrawer: (props: any) => {
      shellLog.entries.push({
        shell: 'RecordDetailDrawer',
        mode: props?.mode,
        carriesMode: props != null && 'mode' in props,
        propValues: props ? Object.values(props) : [],
      });
      return null;
    },
    deriveRecordPageHref: () => null,
  };
});

vi.mock('@object-ui/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/components')>();
  const Real = actual.NavigationOverlay;
  return {
    ...actual,
    NavigationOverlay: (props: any) => {
      shellLog.entries.push({
        shell: 'NavigationOverlay',
        mode: props?.mode,
        carriesMode: props != null && 'mode' in props,
        propValues: props ? Object.values(props) : [],
      });
      return <Real {...props} />;
    },
  };
});

/** Clickable stand-in for the grid — the click is what opens the overlay. */
vi.mock('./CalendarView', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    CalendarView: ({ events, onEventClick }: any) => (
      <div data-testid="calendar-view" data-event-count={String(events.length)}>
        {events.map((e: any) => (
          <button
            key={String(e.id)}
            type="button"
            data-testid={`cv-event-${e.id}`}
            onClick={() => onEventClick?.(e)}
          >
            {e.title}
          </button>
        ))}
      </div>
    ),
  };
});

import { ObjectCalendar } from './ObjectCalendar';

const OVERLAY_MODES = ['drawer', 'modal', 'split', 'popover'] as const;

/** Inside the month the calendar opens on, so the event is drawable at all. */
const NOW = new Date();
const ROWS = (() => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return [{ id: '1', subject: 'Ada review', start_at: iso, end_at: iso }];
})();

const makeDataSource = () =>
  ({
    find: vi.fn(async () => ({ data: ROWS, total: ROWS.length })),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => ({
      name: 'duly_event',
      fields: {
        id: { name: 'id', type: 'text' },
        subject: { name: 'subject', type: 'text' },
        start_at: { name: 'start_at', type: 'datetime' },
        end_at: { name: 'end_at', type: 'datetime' },
      },
    })),
  }) as any;

async function readingsFor(mode: string) {
  cleanup();
  hookLog.calls = [];
  shellLog.entries = [];
  render(
    <ObjectCalendar
      schema={
        {
          type: 'calendar',
          objectName: 'duly_event',
          calendar: { titleField: 'subject', startDateField: 'start_at', endDateField: 'end_at' },
          data: { provider: 'object', object: 'duly_event' },
          navigation: { mode },
        } as never
      }
      dataSource={makeDataSource()}
    />,
  );
  const event = await screen.findByTestId('cv-event-1');
  fireEvent.click(event);
  await waitFor(() => expect(shellLog.entries.length).toBeGreaterThan(0));
  return {
    resolved: hookLog.calls[hookLog.calls.length - 1],
    boundary: shellLog.entries[shellLog.entries.length - 1],
  };
}

beforeEach(() => {
  hookLog.calls = [];
  shellLog.entries = [];
});

afterEach(() => {
  cleanup();
});

describe('MEASURED — ObjectCalendar drops the resolved mode at the shell boundary (objectui#9113)', () => {
  it('LIT CONTROL: both instruments fire on a single mount', async () => {
    const r = await readingsFor('drawer');
    expect(hookLog.calls.length).toBeGreaterThan(0);
    expect(shellLog.entries.length).toBeGreaterThan(0);
    expect(r.resolved.isOverlay).toBe(true);
    expect(r.boundary.shell).toBe('RecordDetailDrawer');
  });

  it.each(OVERLAY_MODES)(
    'authored `%s`: the hook RESOLVES `%s`, and the shell receives no mode at all',
    async (mode) => {
      const r = await readingsFor(mode);
      expect(r.resolved.mode).toBe(mode);
      expect(r.resolved.isOverlay).toBe(true);
      expect(r.boundary.shell).toBe('RecordDetailDrawer');
      expect(r.boundary.carriesMode).toBe(false);
      expect(r.boundary.mode).toBeUndefined();
      expect(r.boundary.propValues).not.toContain(mode);
    },
  );

  it('⭐ THE MEASURED READING: four authored modes produce ONE boundary pair, not four', async () => {
    const pairs: string[] = [];
    const resolvedModes: string[] = [];
    for (const mode of OVERLAY_MODES) {
      const r = await readingsFor(mode);
      pairs.push(`${r.boundary.shell}:${String(r.boundary.mode)}`);
      resolvedModes.push(r.resolved.mode);
    }
    expect(new Set(resolvedModes).size).toBe(4);
    expect(new Set(pairs).size).toBe(1);
    expect(pairs[0]).toBe('RecordDetailDrawer:undefined');
  });
});
