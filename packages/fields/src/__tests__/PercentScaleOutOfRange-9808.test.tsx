/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9808 — a `scale` above the engine's fraction-width ceiling crashed
 * BOTH percent faces, and `@objectstack/spec` accepts the declaration.
 *
 * ── What fails before the repair ────────────────────────────────────────
 * Every out-of-range row below, with an UNCAUGHT `RangeError` — measured on
 * this container's node (v22.22.2), all three sites report the same message:
 *
 * ```
 * PercentField readonly, scale 101   -> RangeError: toFixed() digits argument must be between 0 and 100
 * PercentField editable, scale 101   -> RangeError: toFixed() digits argument must be between 0 and 100
 * PercentCellRenderer, scale 101     -> RangeError: toFixed() digits argument must be between 0 and 100
 * ```
 *
 * ⚠️ The cell face reports `toFixed` even though its formatter is `Intl`:
 * `formatPercentBody` catches the `Intl` `RangeError` and its fallback
 * `displayValue.toFixed(precision)` refuses the same width from inside the
 * `catch`. The recovery arm is what crashed the render.
 *
 * For a React render an uncaught throw takes out the subtree, so the assertion
 * that matters is that the component RENDERS — every row here drives the
 * component and reads the DOM it produced.
 *
 * ── The ruling these rows pin ───────────────────────────────────────────
 * ONE ruling, both faces: a width outside the renderable domain is CLAMPED
 * into it and REPORTED on the console. The reasoning — why a clamp and not a
 * refusal, and why the bounds are the formatters' own rather than this
 * package's — is on `renderablePercentScale` in `../widgets/PercentField`.
 * ⛔ The declaration-side upper bound is NOT this card's: it lives in
 * `@objectstack/spec` and is filed as objectstack#18972.
 *
 * ── The in-range control is the point, not decoration ───────────────────
 * A change that moved ordinary percent fields would be a different card, so
 * the last block pins that an in-range declaration renders exactly as it did
 * and emits NOTHING on the console. `scale: 100` is in that block on purpose:
 * the ceiling is INCLUSIVE, and a clamp that fired there would be a silent
 * off-by-one nobody would see.
 *
 * ⚠️ The diagnostic is deduplicated by DECLARED VALUE (a percent column
 * re-renders per row), so every row below that expects a warning declares a
 * DIFFERENT out-of-range width. Reusing one across two rows would leave the
 * second asserting on a warning the first consumed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PercentField, PERCENT_SCALE_CEILING } from '../widgets/PercentField';
import { PercentCellRenderer } from '../index';

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  cleanup();
});

const percentField = (field: Record<string, unknown>) =>
  ({ type: 'percent', name: 'rate', ...field }) as any;

const renderReadonly = (value: number, field: Record<string, unknown>) =>
  render(<PercentField value={value} onChange={() => {}} field={percentField(field)} readonly />);

const renderEditable = (value: number, field: Record<string, unknown>) =>
  render(<PercentField value={value} onChange={() => {}} field={percentField(field)} />);

const renderCell = (value: unknown, field: Record<string, unknown>) =>
  render(<PercentCellRenderer value={value as any} field={percentField(field)} />);

/** The text the readonly face drew, percent sign included. */
const readonlyText = () => document.body.textContent ?? '';

/** The granularity the browser's spinner and arrow keys obey. */
const inputStep = () => screen.getByRole('spinbutton').getAttribute('step');

/** Digits after the decimal mark in the first number of a rendered string. */
const fractionDigits = (text: string): number => {
  const m = text.match(/\d+[.,](\d+)/);
  return m ? m[1].length : 0;
};

/** Every console line this render produced, joined. */
const warnings = () => warn.mock.calls.map((c) => String(c[0])).join('\n');

describe('an out-of-range percent `scale` is clamped and reported, not thrown (objectui#9808)', () => {
  it('renders the readonly edit face instead of taking out the subtree', () => {
    // The card's headline reading. Before the repair this call threw
    // `RangeError` out of `render` and no DOM existed to assert on.
    expect(() => renderReadonly(0.25, { scale: 101 })).not.toThrow();

    expect(readonlyText()).toContain('%');
    // Clamped to the ceiling, not to this widget's own absent-`scale` 2 — the
    // author asked for the widest width available and got it.
    expect(fractionDigits(readonlyText())).toBe(PERCENT_SCALE_CEILING);
  });

  it('says so on the console rather than guessing quietly', () => {
    renderReadonly(0.25, { scale: 102 });

    const said = warnings();
    // The declared width, the width actually rendered, and the card — an
    // author reading this line can act on it without opening the renderer.
    expect(said).toContain('102');
    expect(said).toContain(String(PERCENT_SCALE_CEILING));
    expect(said).toContain('objectui#9808');
  });

  it('keeps the editable face and its spinner step renderable', () => {
    expect(() => renderEditable(0.25, { scale: 103 })).not.toThrow();

    // `step` is `Math.pow(10, -scale).toFixed(scale)`, the second `toFixed`
    // site on this face; before the repair it refused the same width.
    const step = inputStep();
    expect(step).not.toBeNull();
    expect(fractionDigits(step!)).toBe(PERCENT_SCALE_CEILING);
  });

  it('renders the read-only CELL face, which fails through `Intl` and lands in `toFixed`', () => {
    expect(() => renderCell(0.25, { scale: 104 })).not.toThrow();

    // The cell draws the bar and the number; the bar contributes no text.
    const cell = screen.getByRole('progressbar').parentElement!.textContent ?? '';
    expect(cell).toContain('%');
    expect(fractionDigits(cell)).toBe(PERCENT_SCALE_CEILING);
  });

  it('takes the SAME ruling on both faces for the same declaration', () => {
    // The card's own bound: ⛔ not one face clamping while the other refuses.
    // Both are driven here with one declaration and compared to each other.
    renderReadonly(0.25, { scale: 105 });
    const fromWidget = fractionDigits(readonlyText());
    cleanup();

    renderCell(0.25, { scale: 105 });
    const fromCell = fractionDigits(screen.getByRole('progressbar').parentElement!.textContent ?? '');

    expect(fromWidget).toBe(fromCell);
    expect(fromWidget).toBe(PERCENT_SCALE_CEILING);
  });

  it('clamps a NEGATIVE declared width at the other end of the same domain', () => {
    // `(25).toFixed(-1)` refuses for the same reason `(25).toFixed(101)` does,
    // so one clamp closes both ends. ⚠️ A negative `scale` is NOT spec-valid
    // (the spec's `scale` is `.int().min(0)`), which is why it is pinned here
    // as the domain's lower end rather than as a second defect.
    expect(() => renderReadonly(0.25, { scale: -1 })).not.toThrow();

    expect(fractionDigits(readonlyText())).toBe(0);
    expect(warnings()).toContain('-1');
  });

  it('clamps a non-finite declared width', () => {
    expect(() => renderReadonly(0.25, { scale: Number.POSITIVE_INFINITY })).not.toThrow();

    expect(fractionDigits(readonlyText())).toBe(0);
  });
});

describe('an IN-RANGE percent `scale` is untouched by the ruling (objectui#9808 control)', () => {
  it('renders an ordinary two-decimal percent field exactly as before', () => {
    renderReadonly(0.25, { precision: 10, scale: 2 });

    // The row objectui#9568 pinned, re-read here: the repair must be invisible
    // to it.
    expect(readonlyText()).toContain('25.00%');
    expect(warn).not.toHaveBeenCalled();
  });

  it("leaves the editable face's step alone", () => {
    renderEditable(0.25, { scale: 2 });

    expect(inputStep()).toBe('0.01');
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves the cell face alone', () => {
    renderCell(0.25, { scale: 2 });

    expect(screen.getByRole('progressbar').parentElement!.textContent).toContain('25.00');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not fire AT the ceiling — the bound is inclusive', () => {
    // An off-by-one here would clamp a legal declaration and warn about it,
    // which is the quiet failure this control exists to catch.
    expect(() => renderReadonly(0.25, { scale: PERCENT_SCALE_CEILING })).not.toThrow();

    expect(fractionDigits(readonlyText())).toBe(PERCENT_SCALE_CEILING);
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves a percent field declaring NO `scale` on its own face default', () => {
    // ⛔ This card does not touch what an absent `scale` means, and the two
    // faces still spell it differently (widget 2, cell 0) — the disagreement
    // objectui#9568 declined to make a premise.
    renderReadonly(0.25, {});
    expect(readonlyText()).toContain('25.00%');
    cleanup();

    renderCell(0.25, {});
    expect(screen.getByRole('progressbar').parentElement!.textContent).toContain('25%');

    expect(warn).not.toHaveBeenCalled();
  });
});
