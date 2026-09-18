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
 * Every row below for a width the spec accepts and the engine refuses, with an
 * UNCAUGHT `RangeError` — measured on
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
 * ── The ruling these rows pin, and its EXACT reach ──────────────────────
 * ONE ruling, both faces: a width the installed spec ACCEPTS and the engine
 * REFUSES — a non-negative integer above the ceiling — is CLAMPED to the
 * ceiling and REPORTED on the console. ⛔ And nothing else is touched. A
 * negative, non-finite or non-integer `scale` is a declaration the installed
 * spec already REFUSES, so rescuing it in a renderer would be the
 * lenient-fallback-around-bad-input AGENTS.md #0.1 lists by name; those widths
 * keep the behaviour they had before this ruling existed, which the two
 * `pre-existing path` rows below pin by asserting that they still THROW.
 *
 * The reasoning — why a clamp and not a refusal, and why the bounds are the
 * formatters' own rather than this package's — is on
 * `../widgets/percent-scale`. Its SUNSET condition is not prose here: the last
 * block asks the installed `FieldSchema` whether the premise still holds, on
 * every run.
 * ⛔ The declaration-side upper bound is NOT this card's: it lives in
 * `@objectstack/spec` and was filed as objectstack#18972.
 *
 * ── The in-range control is the point, not decoration ───────────────────
 * A change that moved ordinary percent fields would be a different card, so
 * the second block pins that an in-range declaration renders exactly as it did
 * and draws NO diagnostic of this ruling's. `scale: 100` is in that block on
 * purpose: the ceiling is INCLUSIVE, and a clamp that fired there would be a
 * silent off-by-one nobody would see.
 *
 * ⚠️ Those controls assert on the ruling's own MARKER and ⛔ never on a
 * `console.warn` call count — see `MARKER` below for the measurement that
 * forced the distinction. Each control must hold when it is the ONLY row that
 * runs.
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

import { PercentField } from '../widgets/PercentField';
// The ruling's own module — module-private by design, so the pin imports that
// module path exactly as it imports the widget, and NOT the package barrel.
import { PERCENT_SCALE_CEILING } from '../widgets/percent-scale';
// The installed spec's own door — the instrument the SUNSET block below asks
// on every run, so the ruling's premise is re-derived rather than remembered.
import { FieldSchema } from '@objectstack/spec/data';
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
const warnings = () => warn.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');

/**
 * What the ruling's own diagnostic is recognised BY.
 *
 * ⚠️ Every MUST-NOT-CHANGE control below asserts on THIS, and ⛔ never on
 * `expect(warn).not.toHaveBeenCalled()`. `console.warn` is a SHARED channel:
 * the first render in a module emits react-i18next's `useTranslation` warning
 * through it, so a call-count control passes only while some earlier row in
 * this file has already consumed that first warning — measured, each such
 * control read `1 failed` when run alone with `-t`. A control that holds only
 * in file order cannot tell "the clamp stayed silent" from "another warning
 * got there first", which is ⛔ not a control at all.
 */
const MARKER = 'objectui#9808';

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

  it('leaves a NEGATIVE declared width on its pre-existing path, deliberately', () => {
    // ⛔ This row is INVERTED on purpose, and the inversion is the ruling.
    //
    // `(25).toFixed(-1)` refuses exactly as `(25).toFixed(101)` does, so a
    // clamp over the whole domain would have rescued this too — and that is
    // precisely what it must NOT do. A negative `scale` is a declaration the
    // INSTALLED spec already REFUSES (`z.number().int().min(0)`, measured
    // below in the sunset probe's own instrument), so making it render would
    // be a renderer-side default around bad input: AGENTS.md #0.1's own listed
    // example, inside the module that cites #0.1 as its reason for existing.
    //
    // ⇒ it keeps the behaviour it had before this ruling existed. The place to
    // repair a negative `scale` is the producer that wrote it.
    expect(() => renderReadonly(0.25, { scale: -1 })).toThrow(RangeError);
    expect(warnings()).not.toContain(MARKER);
  });

  it('leaves a NON-FINITE declared width on its pre-existing path, for the same reason', () => {
    // Same inversion, same ground: `Infinity` is refused by the installed
    // spec's `int()` and is not this renderer's to reinterpret.
    expect(() => renderReadonly(0.25, { scale: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(warnings()).not.toContain(MARKER);

    cleanup();
    // And the cell face agrees — one ruling means one answer on both faces for
    // what the ruling does NOT cover, too.
    expect(() => renderCell(0.25, { scale: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  });
});

describe('an IN-RANGE percent `scale` is untouched by the ruling (objectui#9808 control)', () => {
  it('renders an ordinary two-decimal percent field exactly as before', () => {
    renderReadonly(0.25, { precision: 10, scale: 2 });

    // The row objectui#9568 pinned, re-read here: the repair must be invisible
    // to it.
    expect(readonlyText()).toContain('25.00%');
    expect(warnings()).not.toContain(MARKER);
  });

  it("leaves the editable face's step alone", () => {
    renderEditable(0.25, { scale: 2 });

    expect(inputStep()).toBe('0.01');
    expect(warnings()).not.toContain(MARKER);
  });

  it('leaves the cell face alone', () => {
    renderCell(0.25, { scale: 2 });

    expect(screen.getByRole('progressbar').parentElement!.textContent).toContain('25.00');
    expect(warnings()).not.toContain(MARKER);
  });

  it('does not fire AT the ceiling — the bound is inclusive', () => {
    // An off-by-one here would clamp a legal declaration and warn about it,
    // which is the quiet failure this control exists to catch.
    expect(() => renderReadonly(0.25, { scale: PERCENT_SCALE_CEILING })).not.toThrow();

    expect(fractionDigits(readonlyText())).toBe(PERCENT_SCALE_CEILING);
    expect(warnings()).not.toContain(MARKER);
  });

  it('leaves a width the ENGINE already coerces exactly where it was', () => {
    // ⚠️ MEASURED, and the reason the ruling tests "could the engine render
    // this" rather than "did the value change spelling": both formatters
    // coerce for themselves — `(25).toFixed('2')` and
    // `maximumFractionDigits: '2'` render two decimals, and so does `2.9`. A
    // guard that refused a non-number would MOVE a cell that renders today,
    // which is a silent regression on off-spec-but-working metadata and not
    // this card's business.
    renderCell(0.25, { scale: '2' });
    expect(screen.getByRole('progressbar').parentElement!.textContent).toContain('25.00');
    cleanup();

    renderCell(0.25, { scale: 2.9 });
    expect(screen.getByRole('progressbar').parentElement!.textContent).toContain('25.00');

    expect(warnings()).not.toContain(MARKER);
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

    expect(warnings()).not.toContain(MARKER);
  });
});

describe('SUNSET — the premise this ruling rests on, re-derived every run (objectui#9808)', () => {
  /**
   * ⭐ This block exists because a sentence is not an instrument.
   *
   * `percent-scale.ts` clamps rather than refuses for ONE reason: the
   * `@objectstack/spec` this repository INSTALLS accepts a percent field
   * declaring a `scale` above the ceiling, so refusing it in a renderer would
   * invent a contract stricter than the one the renderer is built against
   * (AGENTS.md #0.1 in mirror image).
   *
   * ⚠️ That premise is perishable, and it has already been observed to perish:
   * the upstream bound (objectstack#18972, landed as objectstack#19083) is on
   * the spec repository's `main` and is NOT in the version resolved here, and
   * it landed minutes after the ruling's docblock was written. Nothing in a
   * tree notices prose going stale — so the premise is asked of the installed
   * door here instead, and the day a spec bump answers differently this row
   * goes red and says what to do about it.
   */
  const percentDocument = {
    name: 'discount_rate',
    type: 'percent',
    label: 'Discount Rate',
  };

  it('CONTROL: the installed spec door is live and strict', () => {
    // Without this, an "accepted" verdict below could mean the door admits
    // everything — or that the import resolved to something that parses
    // nothing. A refusal BY NAME proves the instrument is reading the document.
    const res = FieldSchema.safeParse({ ...percentDocument, scale: 2, bogusKey9808: true });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(
      res.error.issues.find(
        (i) => i.code === 'unrecognized_keys' &&
          ((i as { keys?: string[] }).keys ?? []).includes('bogusKey9808'),
      ),
      'the spec door admitted an unknown key — every verdict in this block proves nothing',
    ).toBeDefined();
  });

  it('CONTROL: an ordinary `scale` is accepted, so acceptance is a reading', () => {
    expect(FieldSchema.safeParse({ ...percentDocument, scale: 2 }).success).toBe(true);
  });

  it('the installed spec still ACCEPTS a `scale` above the renderable ceiling', () => {
    const verdict = FieldSchema.safeParse({
      ...percentDocument,
      scale: PERCENT_SCALE_CEILING + 1,
    });

    expect(
      verdict.success,
      'SUNSET REACHED — the installed `@objectstack/spec` now REFUSES a percent `scale` above ' +
        `${PERCENT_SCALE_CEILING}, so the premise objectui#9808 rested on has expired. ` +
        'The clamp in `packages/fields/src/widgets/percent-scale.ts` is from this moment the ' +
        'lenient renderer-side fallback AGENTS.md #0.1 bans, because the declaration it rescues ' +
        'can no longer be authored. ⇒ DELETE that module, its two call sites in `PercentField` ' +
        'and `formatPercent`, this whole test file and the changeset note — do NOT relax this ' +
        'assertion to make the suite green.',
    ).toBe(true);
  });

  it('and it REFUSES the widths this ruling deliberately does not rescue', () => {
    // The other half of the #0.1 reading, asked of the same door: these are
    // declarations the contract already rejects, which is exactly why
    // `renderablePercentScale` leaves them on their pre-existing path instead
    // of inventing a width for them.
    for (const scale of [-1, 2.5, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(
        FieldSchema.safeParse({ ...percentDocument, scale }).success,
        `the installed spec ACCEPTED scale ${String(scale)} — if it is now a legal declaration, ` +
          'the renderer owes it a rendering and this ruling needs re-deciding, not patching',
      ).toBe(false);
    }
  });
});
