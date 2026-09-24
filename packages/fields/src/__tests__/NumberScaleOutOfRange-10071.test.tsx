/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10071 — the two NON-percent readers of a declared `scale` hit the
 * same engine ceiling objectui#9808 guarded on the percent faces.
 *
 * ── What fails before the repair ────────────────────────────────────────
 * Measured on this container's node (v22):
 *
 * ```
 * NumberCellRenderer, scale 101  -> RangeError: minimumFractionDigits value is out of range.
 * computeRow, column scale 101   -> RangeError: toFixed() digits argument must be between 0 and 100
 * ```
 *
 * The cell face reaches `Intl` through `formatDisplayNumber`, whose `catch`
 * retries WITHOUT the locale but WITH the same digits, so the retry refuses
 * the same width and the throw escapes the render. `computeRow` runs on every
 * edit of a master-detail line grid, so there the throw lands in an event
 * handler instead of a render — the edit is lost, not just the cell.
 *
 * ── The ruling ──────────────────────────────────────────────────────────
 * The one objectui#9808 already made, reused rather than restated: a width the
 * installed spec ACCEPTS and the engine REFUSES is clamped to the ceiling and
 * reported once on the console. Everything else keeps its pre-existing path.
 * The reasoning and the SUNSET condition live on `../widgets/percent-scale`;
 * the last block below re-asks the installed spec door whether the premise
 * still holds for THESE two readers' declarations.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import { NumberCellRenderer } from '../index';
import { computeRow, type GridColumn } from '../widgets/GridField';
// Module-private by design (see its header), so imported by module path.
import { PERCENT_SCALE_CEILING as CEILING } from '../widgets/percent-scale';
import { FieldSchema } from '@objectstack/spec/data';

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  cleanup();
});

/** The ruling's own diagnostic marker — never a `console.warn` call count,
 *  for the shared-channel reason `PercentScaleOutOfRange-9808.test.tsx`'s
 *  `MARKER` records. */
const MARKER = 'objectui#10071';

const warnings = () => warn.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');

/** Digits after the decimal mark in the first number of a rendered string. */
const fractionDigits = (text: string): number => {
  const m = text.match(/\d+[.,](\d+)/);
  return m ? m[1].length : 0;
};

const renderNumberCell = (value: unknown, field: Record<string, unknown>) =>
  render(<NumberCellRenderer value={value as never} field={{ type: 'number', name: 'qty', ...field } as never} />);

const cellText = () => document.body.textContent ?? '';

/** A master-detail line: `amount = quantity * unit_price`, as `deriveColumns`
 *  builds it from a child field carrying `expression` + `scale`. */
const amountColumn = (extra: Partial<GridColumn>): GridColumn => ({
  name: 'amount',
  type: 'number',
  computed: true,
  expr: 'record.quantity * record.unit_price',
  ...extra,
});

describe('an out-of-range `scale` on the NUMBER cell is clamped and reported (objectui#10071)', () => {
  it('renders instead of taking out the subtree', () => {
    expect(() => renderNumberCell(1.5, { scale: 101 })).not.toThrow();
    expect(fractionDigits(cellText())).toBe(CEILING);
  });

  it('names the declared width, the rendered width and the card', () => {
    renderNumberCell(1.5, { scale: 102 });
    const said = warnings();
    expect(said).toContain('102');
    expect(said).toContain(String(CEILING));
    expect(said).toContain(MARKER);
  });
});

describe('an out-of-range computed-column `scale` in the GRID is clamped and reported (objectui#10071)', () => {
  it('computes the row instead of throwing out of the edit', () => {
    const row = { quantity: 3, unit_price: 1.25 };
    let next: Record<string, unknown> = {};
    expect(() => {
      next = computeRow([amountColumn({ scale: 103 })], row);
    }).not.toThrow();
    // A 100-digit round of an exact binary value is the value itself.
    expect(next.amount).toBe(3.75);
  });

  it('names the declared width, the rendered width and the card', () => {
    computeRow([amountColumn({ scale: 104 })], { quantity: 1, unit_price: 2 });
    const said = warnings();
    expect(said).toContain('104');
    expect(said).toContain(String(CEILING));
    expect(said).toContain(MARKER);
  });
});

describe('an IN-RANGE `scale` is untouched on both readers (objectui#10071 control)', () => {
  it('number cell: an ordinary scale pads exactly as before', () => {
    renderNumberCell(16, { scale: 2 });
    expect(cellText()).toContain('16.00');
    expect(warnings()).not.toContain(MARKER);
  });

  it('number cell: the ceiling itself is inclusive', () => {
    expect(() => renderNumberCell(1.5, { scale: CEILING })).not.toThrow();
    expect(fractionDigits(cellText())).toBe(CEILING);
    expect(warnings()).not.toContain(MARKER);
  });

  it('grid: an ordinary scale still rounds', () => {
    const next = computeRow([amountColumn({ scale: 2 })], { quantity: 3, unit_price: 0.3333 });
    expect(next.amount).toBe(1);
    expect(warnings()).not.toContain(MARKER);
  });

  it('grid: the ceiling itself is inclusive', () => {
    expect(() => computeRow([amountColumn({ scale: CEILING })], { quantity: 1, unit_price: 2 })).not.toThrow();
    expect(warnings()).not.toContain(MARKER);
  });

  it('grid: a currency column takes its currency minor unit, in range and unreported', () => {
    // The width is the resolved currency's ISO 4217 minor unit now, never
    // `scale ?? 2` (objectui#10355) — pinned there; this is the ceiling's
    // control that the currency path stays quiet.
    const next = computeRow([amountColumn({ type: 'currency' })], { quantity: 3, unit_price: 0.3333 }, 'USD');
    expect(next.amount).toBe(1);
    expect(warnings()).not.toContain(MARKER);
  });

  it('a NEGATIVE width keeps its pre-existing path on both readers', () => {
    // Refused by the installed spec (`int().min(0)`, asked below), so not this
    // renderer's to rescue — AGENTS.md #0.1, the same inversion as objectui#9808.
    expect(() => renderNumberCell(1.5, { scale: -1 })).toThrow(RangeError);
    expect(() => computeRow([amountColumn({ scale: -1 })], { quantity: 1, unit_price: 2 })).toThrow(RangeError);
    expect(warnings()).not.toContain(MARKER);
  });
});

describe('SUNSET — the premise, re-asked of the installed spec for these readers (objectui#10071)', () => {
  // `deriveColumns` copies a child field's `scale` onto a computed column only
  // when the field carries an `expression`, so that is the document asked here.
  const computedNumber = {
    name: 'amount',
    type: 'number',
    label: 'Amount',
    expression: 'quantity * unit_price',
  };

  it('CONTROL: the door is strict — an unknown key is refused by name', () => {
    const res = FieldSchema.safeParse({ ...computedNumber, scale: 2, bogusKey10071: true });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(
      res.error.issues.find(
        (i) => i.code === 'unrecognized_keys' &&
          ((i as { keys?: string[] }).keys ?? []).includes('bogusKey10071'),
      ),
    ).toBeDefined();
  });

  it('the installed spec still ACCEPTS a number `scale` above the ceiling', () => {
    expect(
      FieldSchema.safeParse({ ...computedNumber, scale: CEILING + 1 }).success,
      'SUNSET REACHED — the installed `@objectstack/spec` now REFUSES a `scale` above ' +
        `${CEILING}. The clamp in \`packages/fields/src/widgets/percent-scale.ts\` is from this ` +
        'moment the lenient fallback AGENTS.md #0.1 bans: delete it and every call site that ' +
        'imports it, with this file — do NOT relax this assertion.',
    ).toBe(true);
  });
});
