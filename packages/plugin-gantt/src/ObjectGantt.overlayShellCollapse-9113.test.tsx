/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9113 — THE MEASURED HALF: where the resolved overlay mode is lost.
 *
 * The card measures that `ObjectGantt`, `ObjectKanban` and `ObjectCalendar`
 * render the one `RecordDetailDrawer` for all four overlay `navigation.mode`
 * values, while `ObjectGrid` and `ObjectTree` honour them through the shared
 * `NavigationOverlay`. The LIVE CONTROL for the instrument used here is
 * `plugin-tree/src/ObjectTree.overlayShellControl-9113.test.tsx`, which reads
 * FOUR distinct boundary pairs off the identical technique; this file reads
 * ONE. Neither number means anything without the other.
 *
 * ⛔ THIS ROUND IS A MEASUREMENT, NOT A REPAIR. Nothing here asserts what the
 * remedy should be, and nothing here is a vote for one. The file pins what is
 * true on the base tree so the design question is decidable from a number
 * rather than from a reading.
 *
 * ## Why the assertion is on a mode VALUE and not on a rendered drawer
 *
 * Measured, not assumed: `packages/components/src/ui/sheet.tsx` and
 * `.../ui/dialog.tsx` BOTH import `@radix-ui/react-dialog`, and neither
 * stamps a `data-slot`. `drawer` and `modal` therefore reach the DOM as the
 * same Radix role, separated only by Tailwind class strings. A DOM assertion
 * cannot tell them apart even on the renderer that gets this right, so
 * `expect(drawer).toBeVisible()` is blind to this defect BY CONSTRUCTION — it
 * reads the same before and after any repair.
 *
 * ## ⭐ The sharpest reading in this file: the value is correct, then dropped
 *
 * Two instruments run against the same mount:
 *
 *   1. a pass-through spy on `useNavigationOverlay`, which reports what the
 *      component RESOLVED (this is the objectui#7334 instrument, reused);
 *   2. a pass-through recorder on both overlay components, which reports what
 *      crossed the handoff into the shell.
 *
 * They disagree, and the disagreement IS the defect: the hook resolves
 * `modal` correctly, and then the component hands the record to a component
 * that has no mode parameter to receive it. The loss is at the handoff, not
 * upstream of it — so this is not a re-measurement of objectui#7334, which
 * fixed the half where the value never arrived at all.
 */

import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** What the component RESOLVED, read off the real hook on its way through. */
const hookLog = vi.hoisted(() => ({
  calls: [] as Array<{ mode: string; isOverlay: boolean }>,
}));

/** What crossed the handoff into an overlay shell. */
const shellLog = vi.hoisted(() => ({
  entries: [] as Array<{ shell: string; mode: unknown; carriesMode: boolean; propKeys: string[]; propValues: unknown[] }>,
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

/**
 * Both shells are recorded, not just the one this renderer uses. Recording
 * only `RecordDetailDrawer` would leave "and `NavigationOverlay` was never
 * reached" as an assumption; recorded, it is a reading.
 */
vi.mock('@object-ui/plugin-detail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/plugin-detail')>();
  return {
    ...actual,
    // Returns null: this file measures the HANDOFF, so the drawer's own body
    // is not rendered here. What the body can and cannot be re-hosted in is
    // measured separately, below, against the real components.
    RecordDetailDrawer: (props: any) => {
      shellLog.entries.push({
        shell: 'RecordDetailDrawer',
        mode: props?.mode,
        carriesMode: props != null && 'mode' in props,
        propKeys: props ? Object.keys(props) : [],
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
        propKeys: props ? Object.keys(props) : [],
        propValues: props ? Object.values(props) : [],
      });
      return <Real {...props} />;
    },
  };
});

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

/** Clickable stand-in for the chart — the click is what opens the overlay. */
vi.mock('./GanttView', () => ({
  GanttView: ({ tasks, onTaskClick }: any) => (
    <div data-testid="gantt-view">
      {tasks.map((t: any) => (
        <button
          key={t.id}
          type="button"
          data-testid={`gv-task-${t.id}`}
          onClick={() => onTaskClick?.(t)}
        >
          {t.title}
        </button>
      ))}
    </div>
  ),
}));

import { SchemaRendererProvider, SchemaRenderer } from '@object-ui/react';
import './index';

/**
 * ONE fetch double, installed at module scope and never torn down
 * (objectui#6640 / objectui#7439). `DetailView` issues a fire-and-forget
 * `/api/v1/security/explain` read that no barrier in these tests awaits, so a
 * per-test teardown would restore the real `fetch` while the tree is still
 * mounted and let the read escape to a live socket. happy-dom's document URL
 * is `http://localhost:3000`, which is what makes a relative fetch a real TCP
 * connection in the first place.
 */
vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({}),
    text: async () => '{}',
  })),
);

/** The four overlay modes the spec publishes and `NavigationOverlay` branches on. */
const OVERLAY_MODES = ['drawer', 'modal', 'split', 'popover'] as const;

const ROWS = [
  { id: '1', subject: 'Ada onboarding', visible_from: '2099-09-01', due_date: '2099-09-03' },
];

const makeDataSource = () =>
  ({
    find: vi.fn(async () => ({ data: ROWS, total: ROWS.length })),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => ({
      name: 'duly_task',
      fields: {
        id: { name: 'id', type: 'text' },
        subject: { name: 'subject', type: 'text' },
        visible_from: { name: 'visible_from', type: 'date' },
        due_date: { name: 'due_date', type: 'date' },
      },
    })),
  }) as any;

const BASE: Record<string, any> = {
  type: 'object-gantt',
  objectName: 'duly_task',
  gantt: {
    titleField: 'subject',
    startDateField: 'visible_from',
    endDateField: 'due_date',
  },
};

/**
 * Mount the real `ObjectGantt` with one authored mode, click the task so a
 * record is really selected, and hand back both readings for that mount.
 */
async function readingsFor(mode: string) {
  cleanup();
  hookLog.calls = [];
  shellLog.entries = [];
  render(
    <SchemaRendererProvider dataSource={makeDataSource()}>
      <SchemaRenderer schema={{ ...BASE, navigation: { mode } } as never} />
    </SchemaRendererProvider>,
  );
  const task = await screen.findByTestId('gv-task-1');
  fireEvent.click(task);
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

describe('MEASURED — ObjectGantt drops the resolved mode at the shell boundary (objectui#9113)', () => {
  it('LIT CONTROL: both instruments fire on a single mount', async () => {
    // First, because every assertion below reads a captured value. A shell
    // recorder that never fired would make "no mode crossed the boundary"
    // vacuously true — the exact failure the card's dispatch warned about.
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
      // Upstream of the handoff the value is present and correct.
      expect(r.resolved.mode).toBe(mode);
      expect(r.resolved.isOverlay).toBe(true);
      // At the handoff it is gone. `RecordDetailDrawer` declares no `mode`
      // prop (see `RecordDetailDrawerProps`), and none is passed.
      expect(r.boundary.shell).toBe('RecordDetailDrawer');
      expect(r.boundary.carriesMode).toBe(false);
      expect(r.boundary.mode).toBeUndefined();
      // Nor does the value survive under some other prop name.
      expect(r.boundary.propValues).not.toContain(mode);
    },
  );

  it('`NavigationOverlay` is never reached from this renderer, under any overlay mode', async () => {
    for (const mode of OVERLAY_MODES) {
      await readingsFor(mode);
      expect(shellLog.entries.map((e) => e.shell)).not.toContain('NavigationOverlay');
    }
  });

  it('⭐ THE MEASURED READING: four authored modes produce ONE boundary pair, not four', async () => {
    // Compare against the control file's FOUR. The two numbers together are
    // the measurement this card exists to produce.
    const pairs: string[] = [];
    const resolvedModes: string[] = [];
    for (const mode of OVERLAY_MODES) {
      const r = await readingsFor(mode);
      pairs.push(`${r.boundary.shell}:${String(r.boundary.mode)}`);
      resolvedModes.push(r.resolved.mode);
    }
    // Four distinct values were resolved …
    expect(new Set(resolvedModes).size).toBe(4);
    // … and collapsed into one handoff.
    expect(new Set(pairs).size).toBe(1);
    expect(pairs).toEqual([
      'RecordDetailDrawer:undefined',
      'RecordDetailDrawer:undefined',
      'RecordDetailDrawer:undefined',
      'RecordDetailDrawer:undefined',
    ]);
  });

  it('no diagnostic accompanies the narrowing', async () => {
    // The card calls the failure SILENT; that is measured here rather than
    // asserted. `sonner`'s toast is already mocked above; console is spied
    // for the duration of one unhonourable mode.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await readingsFor('split');
    const said = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map((a) => String(a))
      .join(' ');
    expect(said).not.toMatch(/split/i);
    expect(said).not.toMatch(/navigation\.mode|unsupported|not supported/i);
    warn.mockRestore();
    error.mockRestore();
  });
});

/**
 * ⭐ QUESTION 1 of the card's dispatch, answered by EXECUTION rather than by
 * reading: "is the `Sheet` the CONTAINER or the COMPONENT?"
 *
 * `RecordDetailDrawer` is `<Sheet><SheetContent>` wrapping exactly one
 * payload — `<InlineEditProvider><DetailView/><InlineEditSaveBar/></...>` —
 * plus chrome (`SheetHeader`/`SheetTitle`, sr-only) and a drag handle. This
 * block composes that payload from the SAME exported parts and renders it
 * through `NavigationOverlay`'s `children` render prop in the three NON-Sheet
 * shells. If it mounts and shows record content there, the `Sheet` is a
 * container the payload does not depend on.
 *
 * ⛔ This is a PROBE, not a repair: no source file is touched, nothing is
 * extracted, and no renderer is rewired. It measures portability only.
 *
 * It lives in this package because `plugin-gantt` already depends on BOTH
 * `@object-ui/plugin-detail` and `@object-ui/components`, and because
 * `plugin-detail` is under concurrent work this round (objectui#9197).
 */
describe('QUESTION 1 — the drawer payload renders in the non-Sheet shells (objectui#9113)', () => {
  const RECORD = { id: '1', subject: 'Ada onboarding', owner: 'Grace' };

  /** Compose the payload exactly as `RecordDetailDrawer` does, in one shell. */
  async function renderPayloadInShell(mode: string) {
    cleanup();
    const { InlineEditProvider } = await import('@object-ui/react');
    const { DetailView, InlineEditSaveBar } = await import('@object-ui/plugin-detail');
    const { NavigationOverlay } = await import('@object-ui/components');
    render(
      <NavigationOverlay
        isOpen
        isOverlay
        selectedRecord={RECORD}
        mode={mode as any}
        close={() => {}}
        setIsOpen={() => {}}
        title="Record Detail"
        // `split` renders nothing without it — the overlay hosts the page's
        // own main content in the left panel. That requirement is itself a
        // finding for question 2 and is reported, not worked around.
        mainContent={<div data-testid="main-content" />}
      >
        {(record) => (
          <InlineEditProvider canEdit>
            <DetailView
              inlineEdit
              schema={{
                type: 'detail-view',
                objectName: 'duly_task',
                resourceId: String((record as any).id),
                data: record,
                columns: 2,
                fields: [
                  { name: 'subject', label: 'Subject', type: 'text' },
                  { name: 'owner', label: 'Owner', type: 'text' },
                ],
              } as any}
            />
            <InlineEditSaveBar onFieldSave={async () => {}} />
          </InlineEditProvider>
        )}
      </NavigationOverlay>,
    );
  }

  /**
   * Both field VALUES, not just the record title: the title alone also
   * appears in `DetailView`'s header, so a payload that rendered its header
   * and nothing else would satisfy a title-only assertion. `findAllBy` rather
   * than `findBy` because the title legitimately appears twice — once in the
   * header highlight, once as the `subject` field's value.
   */
  async function expectPayloadContent() {
    expect((await screen.findAllByText('Ada onboarding')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Grace')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Owner')).length).toBeGreaterThan(0);
  }

  it('LIT CONTROL: the payload renders in the shell it ships in today (`drawer`)', async () => {
    // Without this the three cases below could all be passing because the
    // payload renders nothing anywhere. If THIS case fails, the three below
    // are NOT MEASURED — they are not a negative answer.
    await renderPayloadInShell('drawer');
    await expectPayloadContent();
  });

  it.each(['modal', 'split', 'popover'])(
    'the same payload renders inside the `%s` shell',
    async (mode) => {
      await renderPayloadInShell(mode);
      await expectPayloadContent();
    },
  );
});
