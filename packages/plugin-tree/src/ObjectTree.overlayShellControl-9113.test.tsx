/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9113 — THE LIVE CONTROL for the overlay-shell measurement.
 *
 * This card measures a narrowing: `ObjectGantt`, `ObjectKanban` and
 * `ObjectCalendar` collapse the four overlay `navigation.mode` values into one
 * shell. A measurement of an absence is worthless unless the same instrument
 * is shown to register a PRESENCE somewhere, so this file runs the identical
 * instrument against `ObjectTree`, which honours the modes through the shared
 * `NavigationOverlay`. The measured half lives in
 * `plugin-gantt/src/ObjectGantt.overlayShellCollapse-9113.test.tsx`.
 *
 * ⭐ WHY THE INSTRUMENT IS NOT A DOM ASSERTION, measured rather than assumed.
 * `packages/components/src/ui/sheet.tsx` and `.../ui/dialog.tsx` BOTH import
 * `@radix-ui/react-dialog` — `Sheet` is `SheetPrimitive.Root` where
 * `SheetPrimitive` *is* `@radix-ui/react-dialog`. Neither primitive stamps a
 * `data-slot` (zero hits across both files). So `drawer` and `modal` reach the
 * DOM as the same Radix role, separated only by Tailwind class strings, which
 * are not a contract. A DOM-level assertion cannot tell `modal` from `drawer`
 * EVEN HERE, on the renderer that gets it right — which is exactly why the
 * card's dispatch forbade one. The instrument below reads the resolved MODE
 * VALUE at the shell boundary instead.
 *
 * ## What "the shell boundary" means, and why the measurement is a PAIR
 *
 * Every one of the five view renderers resolves a mode through
 * `useNavigationOverlay` and then hands the record to some overlay component.
 * The observable this card needs is what crosses THAT handoff:
 *
 *     (shell component that receives the record, mode value it receives)
 *
 * On this renderer the pair's second element tracks the authored mode, so four
 * authored modes produce FOUR distinct pairs. On the three collapsing
 * renderers the receiving component is `RecordDetailDrawer`, which declares no
 * mode prop at all, so four authored modes produce ONE pair. That cardinality
 * — 4 here, 1 there — is the measurement.
 *
 * ⛔ This file asserts nothing about which shell is CORRECT for a tree, and
 * nothing about the remedy. It establishes only that the instrument has the
 * resolution the card needs.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The shell-boundary log. Recorded from inside a pass-through wrapper around
 * the REAL `NavigationOverlay` — the real component still renders, so nothing
 * about the tree's behaviour is faked away; the wrapper only reads the props
 * on their way in.
 */
const shellLog = vi.hoisted(() => ({
  entries: [] as Array<{ shell: string; mode: unknown; carriesMode: boolean }>,
}));

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
      });
      return <Real {...props} />;
    },
  };
});

import { ObjectTree } from './ObjectTree';

/** The four overlay modes the spec publishes and `NavigationOverlay` branches on. */
const OVERLAY_MODES = ['drawer', 'modal', 'split', 'popover'] as const;

const ROWS = [
  { id: '1', name: 'Acme', parent_id: null },
  { id: '2', name: 'Engineering', parent_id: '1' },
];

/**
 * Mount `ObjectTree` with one authored mode, click a row so a record is really
 * selected, and hand back the last pair that crossed the shell boundary.
 *
 * Rows arrive through the `data` PROP, so no `dataSource` is needed and the
 * only variable across cases is the authored mode.
 */
async function boundaryPairFor(mode: string) {
  cleanup();
  shellLog.entries = [];
  render(
    <ObjectTree
      schema={
        {
          type: 'object-tree',
          objectName: 'org_chart_node',
          parentField: 'parent_id',
          labelField: 'name',
          fields: ['name'],
          navigation: { mode },
        } as never
      }
      data={ROWS}
    />,
  );
  const cell = await screen.findByText('Acme');
  fireEvent.click(cell);
  await waitFor(() => expect(shellLog.entries.length).toBeGreaterThan(0));
  return shellLog.entries[shellLog.entries.length - 1];
}

beforeEach(() => {
  shellLog.entries = [];
});

afterEach(() => {
  cleanup();
});

describe('CONTROL — ObjectTree carries the resolved mode across the shell boundary (objectui#9113)', () => {
  it('LIT CONTROL: the shell-boundary instrument fires at all', async () => {
    // First, for the reason the sibling files in this package put theirs
    // first: every assertion below reads a captured pair, so an instrument
    // that never fired would make all of them vacuous rather than red. If
    // this case goes silent the whole measurement — here and in the gantt
    // file, which uses the same technique — is a dark instrument.
    const pair = await boundaryPairFor('drawer');
    expect(shellLog.entries.length).toBeGreaterThan(0);
    expect(pair.shell).toBe('NavigationOverlay');
    expect(pair.carriesMode).toBe(true);
  });

  it.each(OVERLAY_MODES)('authored `%s` reaches the shell AS `%s`', async (mode) => {
    const pair = await boundaryPairFor(mode);
    expect(pair.shell).toBe('NavigationOverlay');
    expect(pair.mode).toBe(mode);
  });

  it('⭐ THE CONTROL READING: four authored modes produce FOUR distinct boundary pairs', async () => {
    // This is the number the measured half is compared against. `ObjectTree`
    // hands the shell a different mode for each authored value, so the
    // renderer preserves the full overlay vocabulary across the handoff.
    const pairs: string[] = [];
    for (const mode of OVERLAY_MODES) {
      const pair = await boundaryPairFor(mode);
      pairs.push(`${pair.shell}:${String(pair.mode)}`);
    }
    expect(new Set(pairs).size).toBe(4);
    expect(pairs).toEqual([
      'NavigationOverlay:drawer',
      'NavigationOverlay:modal',
      'NavigationOverlay:split',
      'NavigationOverlay:popover',
    ]);
  });
});
