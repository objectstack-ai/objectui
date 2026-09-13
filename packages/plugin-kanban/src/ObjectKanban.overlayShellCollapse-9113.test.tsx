/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9113 — the SECOND of the three collapsing renderers, measured.
 *
 * The instrument, the reasoning behind it and the question-1 portability
 * probe all live in
 * `plugin-gantt/src/ObjectGantt.overlayShellCollapse-9113.test.tsx`; its LIVE
 * CONTROL is `plugin-tree/src/ObjectTree.overlayShellControl-9113.test.tsx`,
 * which reads FOUR distinct boundary pairs off the identical technique. This
 * file exists because the card names three renderers and a card that names
 * three should measure three — the three call sites are textually alike, and
 * "alike" is exactly the kind of claim this round is supposed to check rather
 * than assume.
 *
 * ⛔ MEASUREMENT, NOT REPAIR. Nothing here votes for a remedy.
 *
 * ⚠️ The mode is NOT separable from the DOM here: `ui/sheet.tsx` and
 * `ui/dialog.tsx` both import `@radix-ui/react-dialog` and neither stamps a
 * `data-slot`, so `drawer` and `modal` would render as the same role. The
 * reading below is the resolved mode VALUE at the shell boundary.
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

import { I18nProvider } from '@object-ui/i18n';
import { registerAllFields } from '@object-ui/fields';
import { ObjectKanban } from './ObjectKanban';

// Pay the board's lazy chunk at import time, not inside a `findBy` budget
// (AGENTS.md §测试纪律) — the specifier must stay byte-identical to `./index`'s.
import './KanbanImpl';

registerAllFields();

const OVERLAY_MODES = ['drawer', 'modal', 'split', 'popover'] as const;

const CARDS = [{ id: '1', title: 'On the board', status: 'todo' }];

async function readingsFor(mode: string) {
  cleanup();
  hookLog.calls = [];
  shellLog.entries = [];
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }}>
      <ObjectKanban
        schema={
          {
            type: 'object-kanban',
            objectName: 'duly_card',
            groupBy: 'status',
            columns: [{ id: 'todo', title: 'To Do' }],
            data: CARDS,
            navigation: { mode },
          } as never
        }
      />
    </I18nProvider>,
  );
  const card = await screen.findByText('On the board');
  fireEvent.click(card);
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

describe('MEASURED — ObjectKanban drops the resolved mode at the shell boundary (objectui#9113)', () => {
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
