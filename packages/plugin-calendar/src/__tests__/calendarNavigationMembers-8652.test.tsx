/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The MEMBERS of `object-calendar.navigation`, pinned at what the CALENDAR
 * reads (objectui#8652).
 *
 * objectui#8652 declares `navigation` on this block — on both
 * `ObjectCalendarSchema` faces in `@object-ui/types` and in the registration
 * `inputs` (`OBJECT_CALENDAR_INPUTS`, shared by the `object-calendar` and
 * `calendar` tags) — as the objectui half of the maintainer's ruling 「B」,
 * whose platform half is `@objectstack/spec` 17.5.0 declaring the key on this
 * element. An `object`-armed input owes a member pin (objectui#8212), and this
 * file is it: every member is driven through a real event click on the real
 * calendar, and each row asserts what the click DID.
 *
 * PRIOR ART, stated rather than credited: `ObjectCalendar.overlayShellModes-9299`
 * pins the four OVERLAY values of `mode` across the shell boundary,
 * `ObjectCalendar.navWidthDefault` pins the width of an unauthored drawer, and
 * `ObjectCalendar.navigationRecordSource-7638` pins which object the new-tab URL
 * is built from. This file pins the other members, with the precedence between
 * them, on the model of the grid's `gridNavigationMembers-8071`.
 *
 * What the rows establish:
 *
 *   - **An ABSENT key opens a drawer** — the calendar's own
 *     `{ mode: 'drawer' }`, not the spec's `mode` default. The lit control
 *     every "nothing happened" row below leans on.
 *   - **`none` and `preventNavigation` open nothing**, and the flag outranks an
 *     overlay mode.
 *   - **`new_window` and `openNewTab` open the record page in a new tab**;
 *     `openNewTab` outranks `page`.
 *   - **`size` and `width` are ONE decision**: `width` (deprecated) wins over a
 *     `size` beside it, a bucket name resolves through the size table, and
 *     `auto` lands on the calendar's default width.
 *   - **The resolved mode decides who owns the click** — and this is where the
 *     calendar differs from the board: an OVERLAY mode keeps the click even
 *     from a parent view's `onRowClick` / `onEventClick`, while any other mode
 *     hands it to them.
 *
 * ⚠️ And the one value the calendar does NOT honour on its own, pinned because
 * the registration's description states it and a description is a claim about
 * this renderer: `page` has no navigation channel on a calendar no parent view
 * navigates for, so it opens NOTHING — and a block written without `mode`
 * resolves to `page`, the spec's default. Those two rows pin the DESCRIPTION's
 * warning. A calendar that learns to navigate on `page` reddens them, and the
 * fix is to rewrite that description with them, ⛔ not to relax the rows.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  assertNoOtherNetworkEscape,
  installRecordSecurityExplainDouble,
} from '@object-ui/test-support';
import { RECORD_OVERLAY_DEFAULT_WIDTH } from '@object-ui/plugin-detail';
import type { ObjectCalendarSchema } from '@object-ui/types';

import { ObjectCalendar } from '../ObjectCalendar';

/** The block's own object name, which the new-tab URL is built from. */
const OBJECT = 'events';

/**
 * The month grid renders the month `currentDate` is on, and `currentDate`
 * initialises to today — so the event has to sit in the CURRENT month to be
 * on screen. Noon keeps a timezone shift from moving it across the boundary.
 */
function eventInCurrentMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0).toISOString();
}

type HostProps = {
  onRowClick?: (record: Record<string, unknown>, event?: unknown) => void;
  onEventClick?: (record: unknown) => void;
};

/**
 * Mount one calendar with an authored `navigation` (or none), click its one
 * event, and hand back the `window.open` spy. The document is typed at the
 * published schema: `navigation` is a declared member now, so no cast is
 * needed. `staticData` is the block's declared door for inline rows.
 */
async function clickEvent(
  navigation: ObjectCalendarSchema['navigation'] | undefined,
  props: HostProps = {},
) {
  const open = vi.fn();
  vi.stubGlobal('open', open);
  const schema = {
    type: 'object-calendar',
    objectName: OBJECT,
    calendar: { startDateField: 'starts_at', titleField: 'name' },
    staticData: [{ id: '1', name: 'On the calendar', starts_at: eventInCurrentMonth() }],
    ...(navigation ? { navigation } : {}),
  } satisfies ObjectCalendarSchema;
  render(<ObjectCalendar schema={schema} {...props} />);
  fireEvent.click(await screen.findByText('On the calendar'));
  return { open };
}

/** Give a click every chance to have done something before asserting it did not. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement | null;

/**
 * The resolved overlay width, read off the `--ov-w` custom property the shared
 * shell publishes (it caps the panel with `sm:max-w-[var(--ov-w,42rem)]`), so
 * the custom property IS the resolved value.
 */
function panelWidth(): string {
  const panel = dialog();
  expect(panel, 'overlay panel').not.toBeNull();
  return panel!.style.getPropertyValue('--ov-w').trim();
}

/** What the shell makes of an authored width: the authored value as a FLOOR. */
const withFloor = (css: string) => `max(${css}, min(60vw, 880px))`;

beforeEach(() => {
  // A drag-resized width persisted in localStorage would mask every width row.
  try { window.localStorage.clear(); } catch { /* private mode */ }
  // The drawer's `DetailView` asks `POST /api/v1/security/explain` whether the
  // record may be edited; served from a double rather than the network.
  installRecordSecurityExplainDouble(vi);
});

afterEach(() => {
  assertNoOtherNetworkEscape(expect);
  // Unmount BEFORE restoring the real globals (objectui#7439).
  cleanup();
  vi.unstubAllGlobals();
});

describe('object-calendar `navigation` members decide the event click (objectui#8652)', () => {
  it('LIT CONTROL: with NO `navigation` an event click opens the record in a drawer', async () => {
    // First, because every "nothing happened" row below would be vacuous
    // against a calendar whose events are not clickable in this harness.
    const { open } = await clickEvent(undefined);
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(open).not.toHaveBeenCalled();
  });

  it('`mode: "none"` opens nothing', async () => {
    const { open } = await clickEvent({ mode: 'none' });
    await settle();
    expect(dialog()).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it('`preventNavigation: true` OUTRANKS an overlay mode', async () => {
    const { open } = await clickEvent({ mode: 'drawer', preventNavigation: true });
    await settle();
    expect(dialog()).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });

  it('…and the SAME config without the flag opens the drawer', async () => {
    // The control that keeps the absence above from reading as a dead harness.
    await clickEvent({ mode: 'drawer' });
    await waitFor(() => expect(dialog()).not.toBeNull());
  });

  it('`mode: "new_window"` opens the record page in a new tab, and no overlay', async () => {
    const { open } = await clickEvent({ mode: 'new_window' });
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open).toHaveBeenCalledWith(`/${OBJECT}/record/1`, '_blank');
    expect(dialog()).toBeNull();
  });

  it('`openNewTab: true` OUTRANKS `mode: "page"`', async () => {
    const { open } = await clickEvent({ mode: 'page', openNewTab: true });
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open).toHaveBeenCalledWith(`/${OBJECT}/record/1`, '_blank');
  });

  it('`size` reaches the overlay through the bucket table', async () => {
    await clickEvent({ mode: 'drawer', size: 'lg' });
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(panelWidth()).toBe(withFloor('min(92vw, 960px)'));
  });

  it('a deprecated `width` WINS over `size` authored beside it', async () => {
    await clickEvent({ mode: 'drawer', size: 'sm', width: '720px' });
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(panelWidth()).toBe(withFloor('720px'));
  });

  it('`size: "auto"` resolves to NEITHER member and lands on the calendar default', async () => {
    await clickEvent({ mode: 'drawer', size: 'auto' });
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(panelWidth()).toBe(withFloor(RECORD_OVERLAY_DEFAULT_WIDTH));
  });

  it('an OVERLAY mode keeps the click from a parent view\'s handlers', async () => {
    const onRowClick = vi.fn();
    const onEventClick = vi.fn();
    await clickEvent({ mode: 'drawer' }, { onRowClick, onEventClick });
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(onRowClick).not.toHaveBeenCalled();
    expect(onEventClick).not.toHaveBeenCalled();
  });

  it('…and any OTHER mode hands the click to them', async () => {
    // The same parent, `page` instead of `drawer`: the hook calls `onRowClick`
    // with the record, and the calendar also fires `onEventClick`.
    const onRowClick = vi.fn();
    const onEventClick = vi.fn();
    await clickEvent({ mode: 'page' }, { onRowClick, onEventClick });
    await waitFor(() => expect(onRowClick).toHaveBeenCalledTimes(1));
    expect(onRowClick.mock.calls[0][0]).toMatchObject({ id: '1' });
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });
});

describe('the registration description\'s `page` warning is TRUE (objectui#8652)', () => {
  it('`mode: "page"` opens NOTHING on a calendar no parent view navigates for', async () => {
    const { open } = await clickEvent({ mode: 'page' });
    await settle();
    expect(dialog(), 'page mode opened an overlay — rewrite the `navigation` description').toBeNull();
    expect(open, 'page mode navigated — rewrite the `navigation` description').not.toHaveBeenCalled();
  });

  it('a block WITHOUT `mode` resolves to `page` — so it opens nothing either', async () => {
    // The trap the description warns about: `size` alone, written to widen the
    // default drawer, silences the click, because the absent `mode` is the
    // spec's `page` and not the calendar's `drawer`. Compare the LIT CONTROL.
    const { open } = await clickEvent({ size: 'lg' });
    await settle();
    expect(dialog(), 'a mode-less block opened an overlay — rewrite the `navigation` description').toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});
