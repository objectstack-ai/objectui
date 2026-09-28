/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The dashboard auto-refresh timer FIRES, on both mount points (objectui#8820).
 *
 * ## Why the assertion is a call count
 *
 * When this file was written, every other test for `refreshIntervalSeconds`
 * pinned a DECLARATION: that `inputs` publishes the key, that the config panel
 * carries a field for it, that a locale has a label for it. None of those goes
 * red if the timer never runs. So the claim here is `onRefresh` being CALLED, a counted number of
 * times, after the fake time the fixture's own period asks for, on real
 * mounted components. Nothing spies on `setInterval` to prove firing: a test
 * that asserted `setInterval` was called with `30000` would stay green if the
 * callback it scheduled never reached `onRefresh`.
 *
 * ## Both mount points, deliberately
 *
 * `DashboardGridLayout` and `DashboardRenderer` each carried their own copy of
 * this timer until objectui#8820 moved both onto `useDashboardAutoRefresh`.
 * Each component is mounted and driven on its own, so a surface that stops
 * wiring the hook fails under its own name. ⛔ Do not collapse the cases into
 * one parameterised case over the hook: the hook working is not the claim; the
 * claim is that both components still wire it.
 *
 * The last case of each block is the de-duplication pin: it goes red for a
 * surface that carries its own timer instead of calling the shared hook.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import type { DashboardComponentSchema } from '@object-ui/types';
import { DashboardGridLayout } from '../DashboardGridLayout';
import { DashboardRenderer } from '../DashboardRenderer';
import { useDashboardAutoRefresh } from '../useDashboardAutoRefresh';

// The real hook, wrapped so each surface's call to it can be observed. The
// timer under test is still the real one.
vi.mock('../useDashboardAutoRefresh', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../useDashboardAutoRefresh')>();
  return { ...actual, useDashboardAutoRefresh: vi.fn(actual.useDashboardAutoRefresh) };
});

const sharedHook = vi.mocked(useDashboardAutoRefresh);

interface SurfaceProps {
  schema: DashboardComponentSchema;
  onRefresh?: () => void;
}

/** The two components under test, each named, so a failure says which one. */
const SURFACES: ReadonlyArray<readonly [string, React.ComponentType<SurfaceProps>]> = [
  ['DashboardGridLayout', DashboardGridLayout],
  ['DashboardRenderer', DashboardRenderer],
];

const dash = (root: Record<string, unknown>): DashboardComponentSchema =>
  ({ type: 'dashboard', name: 'ops', widgets: [], ...root }) as unknown as DashboardComponentSchema;

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  sharedHook.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Mount `Surface` with `schema`, run `ms` of fake time, report the call count. */
function refreshesWithin(
  Surface: React.ComponentType<SurfaceProps>,
  schema: DashboardComponentSchema,
  ms: number,
): number {
  const onRefresh = vi.fn();
  render(<Surface schema={schema} onRefresh={onRefresh} />);
  // Nothing may have fired yet: a timer that ran on mount would be a
  // different bug, and this is the control for it.
  expect(onRefresh, 'refreshed before its first period elapsed').not.toHaveBeenCalled();
  advance(ms);
  return onRefresh.mock.calls.length;
}

/** Pending fake timers right after mounting `Surface` on a clean clock. */
function timersArmedOnMount(
  Surface: React.ComponentType<SurfaceProps>,
  schema: DashboardComponentSchema,
  onRefresh?: () => void,
): number {
  vi.clearAllTimers();
  const view = render(<Surface schema={schema} onRefresh={onRefresh} />);
  const pending = vi.getTimerCount();
  view.unmount();
  return pending;
}

// `_name` only feeds the `%s` in the title: the run output has to say WHICH
// surface failed, since the two blocks are otherwise identical.
describe.each(SURFACES)('%s: the auto-refresh timer fires (objectui#8820)', (_name, Surface) => {
  it('fires every `refreshIntervalSeconds` seconds', () => {
    // 30s period, 95s of time: three firings. The COUNT, not merely "was
    // called", is what separates a running interval from a one-shot: a
    // `setTimeout` mistaken for a `setInterval` returns 1 here.
    expect(refreshesWithin(Surface, dash({ refreshIntervalSeconds: 30 }), 95_000)).toBe(3);
  });

  it('does not start when no period is authored', () => {
    expect(refreshesWithin(Surface, dash({}), 95_000)).toBe(0);
  });

  it.each([0, -30])('does not start when the period is %d', (seconds) => {
    // `0` is an authored value meaning "off"; a negative one is off as well.
    expect(refreshesWithin(Surface, dash({ refreshIntervalSeconds: seconds }), 95_000)).toBe(0);
  });

  it('does not read the retired `refreshInterval` spelling', () => {
    // The spec's `DashboardSchema` refuses this key by name, so a renderer
    // fallback for it would be a second, unsanctioned contract (AGENTS.md #0.1).
    expect(refreshesWithin(Surface, dash({ refreshInterval: 30 }), 95_000)).toBe(0);
  });

  it('arms no interval without an `onRefresh` host handler', () => {
    const baseline = timersArmedOnMount(Surface, dash({}), vi.fn());
    const wired = timersArmedOnMount(Surface, dash({ refreshIntervalSeconds: 30 }), vi.fn());
    const unwired = timersArmedOnMount(Surface, dash({ refreshIntervalSeconds: 30 }));
    // The control: with a handler, the same period arms exactly one timer
    // more than no period does, so the count below can see an interval.
    expect(wired, 'control: a wired handler arms one interval').toBe(baseline + 1);
    expect(unwired, 'an interval was armed with no handler to call').toBe(baseline);
    // And the unwired surface survives the time passing.
    render(<Surface schema={dash({ refreshIntervalSeconds: 30 })} />);
    expect(() => advance(95_000)).not.toThrow();
  });

  it('stops when the dashboard unmounts', () => {
    const onRefresh = vi.fn();
    const view = render(
      <Surface schema={dash({ refreshIntervalSeconds: 30 })} onRefresh={onRefresh} />,
    );
    advance(30_000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    view.unmount();
    advance(300_000);
    expect(onRefresh, 'the interval outlived the component').toHaveBeenCalledTimes(1);
  });

  it('re-arms on a changed period: the old interval is cleared, the new period used', () => {
    const onRefresh = vi.fn();
    const view = render(
      <Surface schema={dash({ refreshIntervalSeconds: 30 })} onRefresh={onRefresh} />,
    );
    advance(30_000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    view.rerender(<Surface schema={dash({ refreshIntervalSeconds: 60 })} onRefresh={onRefresh} />);
    // Re-armed at 30s with a 60s period: the next firing is at 90s. A 30s
    // interval that survived the change would fire at 60s.
    advance(59_000);
    expect(onRefresh, 'the old 30s interval survived the change').toHaveBeenCalledTimes(1);
    advance(1_000);
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('keeps its phase across a re-render that repeats the same period', () => {
    const onRefresh = vi.fn();
    const view = render(
      <Surface schema={dash({ refreshIntervalSeconds: 30 })} onRefresh={onRefresh} />,
    );
    advance(20_000);
    // A new schema object with the same period: the timer keys on the value,
    // so it is not restarted and still fires at 30s rather than at 50s.
    view.rerender(<Surface schema={dash({ refreshIntervalSeconds: 30 })} onRefresh={onRefresh} />);
    advance(10_000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls the current `onRefresh` after the host swaps it, never the old one', () => {
    const first = vi.fn();
    const second = vi.fn();
    const schema = dash({ refreshIntervalSeconds: 30 });
    const view = render(<Surface schema={schema} onRefresh={first} />);
    advance(30_000);
    view.rerender(<Surface schema={schema} onRefresh={second} />);
    advance(60_000);
    expect(first, 'a stale handler kept firing').toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('takes its timer from the shared `useDashboardAutoRefresh` hook', () => {
    const onRefresh = vi.fn();
    render(<Surface schema={dash({ refreshIntervalSeconds: 30 })} onRefresh={onRefresh} />);
    expect(sharedHook).toHaveBeenCalledWith(
      expect.objectContaining({ refreshIntervalSeconds: 30 }),
      onRefresh,
    );
  });
});
