/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The business-time-zone shim `GanttView` renders through, in a module of its
 * own (objectui#10866).
 *
 * It moved out of `GanttView.tsx` unchanged, because `ObjectGantt` now asks it
 * too: a date-only day has to be handed to the view as the instant the shim
 * re-bases back onto that day (`readTaskDate` in `ObjectGantt.tsx`). The
 * `ObjectGantt` suites replace the `./GanttView` module with a probe
 * (`vi.mock('./GanttView', …)`), so an import of the shim from there is
 * undefined in each of them. `GanttView.tsx` re-exports `makeTzShift`, so its
 * existing import sites are unchanged.
 */

/** Offset (ms east of UTC) of an IANA time zone at a given instant. */
function tzOffsetMs(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const get = (type: string) => Number(dtf.formatToParts(at).find((p) => p.type === type)?.value ?? 0);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUTC - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * "Shifted clock" for business-time-zone rendering: translate
 * real instants into a display space where the browser's local clock reads
 * the CONFIGURED zone's wall time. All existing local-clock logic — shift
 * bands, day columns, snapping, the today line, date labels — then renders
 * that zone correctly for every viewer; writes translate back so persisted
 * data stays real instants. Per-instant offsets keep DST zones close;
 * fixed-offset zones (Asia/Shanghai) are exact.
 */
export function makeTzShift(timeZone?: string): {
  delta: number;
  to: (d: Date) => Date;
  from: (d: Date) => Date;
  now: () => Date;
} {
  const identity = { delta: 0, to: (d: Date) => d, from: (d: Date) => d, now: () => new Date() };
  if (!timeZone) return identity;
  try {
    tzOffsetMs(timeZone, new Date()); // validate the IANA name early
  } catch {
    console.warn(`[GanttView] invalid timeZone "${timeZone}" — falling back to the browser zone`);
    return identity;
  }
  const deltaAt = (d: Date) => tzOffsetMs(timeZone, d) - -d.getTimezoneOffset() * 60000;
  const probe = deltaAt(new Date());
  if (probe === 0) return identity;
  return {
    delta: probe,
    to: (d: Date) => new Date(d.getTime() + deltaAt(d)),
    from: (d: Date) => new Date(d.getTime() - deltaAt(d)),
    now: () => new Date(Date.now() + deltaAt(new Date())),
  };
}
