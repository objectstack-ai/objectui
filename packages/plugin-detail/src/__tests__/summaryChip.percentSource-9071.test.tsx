/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ONE record, TWO places, ONE number (objectui#9071).
 *
 * ## What this pins, and why it is not "the chip's new number is right"
 *
 * The chip beside the record H1 scaled a stored `percent` by a rule of its
 * own — a pass-through above 1, a scale-by-100 at or below it — while the
 * declared single source of truth (`percentDisplayValue` in
 * `@object-ui/core`, which the list cell reaches through `formatPercent`)
 * uses the symmetric `value > -1 && value < 1`. The two rules disagree at
 * EXACTLY 1 and at every value at or below -1.
 *
 * Triage's judgement is the acceptance, and it is about DISAGREEMENT, not
 * about the chip:
 *
 *   "a stored `1` renders `100%` in the chip and `1%` everywhere else" — the
 *   same record showing two different numbers in two places is the kind of
 *   disagreement a user reports as a data bug rather than a formatting one.
 *
 * So every case here renders BOTH surfaces from the SAME stored value and the
 * SAME field, and asserts they agree. A pin that only checked the chip could
 * not fail for the reason this card exists: it would go green on a chip that
 * had simply moved to a fourth rule of its own.
 *
 * ## Two instruments, because neither alone covers the disagreement set
 *
 * - **The stated text.** The only instrument that reaches a value at or below
 *   -1: both bars clamp a negative to an empty track, so the bar cannot tell
 *   `-5%` from `-500%`. ⚠️ Valid only where the two surfaces' CONVENTIONS
 *   coincide — the chip appends a bare `%` to the full number, the cell renders
 *   through the locale's percent affix at the field's precision (0 by default).
 *   Every row asserted by text below scales to an integral count of percentage
 *   points under four digits, where the two conventions are byte-identical.
 *   The last case pins a value where they are NOT, so the half this card does
 *   not fix is a recorded fact rather than a silence.
 * - **The drawn bar.** Read off each surface's own fill width, before any
 *   rounding, so it states agreement on the scaled MAGNITUDE independently of
 *   how either side spells it.
 *
 * ## The live control
 *
 * `0.25` is inside the band where the two rules already agreed before this
 * change. It renders identically in both places on both legs of the ablation —
 * if it ever moves, the repair reached further than the boundary.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as React from 'react';
import { I18nProvider, LocalizationProvider } from '@object-ui/i18n';
import { PercentCellRenderer } from '@object-ui/fields';
import { DetailView } from '../DetailView';
import type { DetailViewSchema, FieldMetadata } from '@object-ui/types';

/**
 * `useRecordEditable` falls back to the GLOBAL fetch with no
 * `SchemaRendererProvider` in the tree; under happy-dom that is a real request.
 * Served from a double so no case here depends on the network.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ record: { visible: true } }) })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

/**
 * The field both surfaces are handed. `ratio` is deliberate: it does NOT match
 * the cell renderer's whole-percent name pattern (`progress` / `completion`),
 * so both surfaces are on the fraction-inferring path this card is about.
 */
const FIELD: FieldMetadata = { name: 'ratio', label: 'Ratio', type: 'percent' };

interface Rendered {
  /** What the surface SAYS, whitespace-collapsed. */
  text: string;
  /** What the surface DRAWS, read off its own fill width. */
  bar: number;
}

/** Place one: the `summaryFields` chip beside the record H1. */
function renderChip(stored: number): Rendered {
  const container = render(
    <DetailView
      schema={
        {
          type: 'record:details',
          objectName: 'account',
          summaryFields: ['ratio'],
          fields: [{ ...FIELD }],
          data: { id: 'A9', name: 'Acme', ratio: stored },
        } as unknown as DetailViewSchema
      }
    />,
  ).container;
  const chip = container.querySelector<HTMLElement>('[data-summary-chip="ratio"]');
  expect(chip, 'a summary chip for "ratio" is beside the H1').not.toBeNull();
  const fill = chip!.querySelector<HTMLElement>('[aria-hidden] span[style]');
  expect(fill, 'the chip draws its own bar fill').not.toBeNull();
  return { text: (chip!.textContent ?? '').replace(/\s+/g, ' ').trim(), bar: pct(fill!.style.width) };
}

/**
 * Place two: the list cell — `PercentCellRenderer`, the surface that reaches
 * `percentDisplayValue` through `formatPercent`. Mounted under an explicit
 * `en` session so the comparison is a property of the SCALING and not of
 * whatever locale the runner happens to carry.
 */
function renderCell(stored: number): Rendered {
  const container = render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <LocalizationProvider value={{ locale: 'en' }}>
        <PercentCellRenderer value={stored} field={{ ...FIELD }} />
      </LocalizationProvider>
    </I18nProvider>,
  ).container;
  const bar = container.querySelector<HTMLElement>('[role="progressbar"] div[style]');
  expect(bar, 'the cell draws its own bar fill').not.toBeNull();
  const value = container.querySelector<HTMLElement>('span.tabular-nums');
  expect(value, 'the cell states its own percentage').not.toBeNull();
  return { text: (value!.textContent ?? '').replace(/\s+/g, ' ').trim(), bar: pct(bar!.style.width) };
}

function pct(width: string): number {
  expect(width, 'the fill width is a percentage').toMatch(/%$/);
  return Number(width.slice(0, -1));
}

interface Row {
  what: string;
  stored: number;
  /** The one percentage BOTH surfaces state. */
  text: string;
  /** The one magnitude BOTH surfaces draw, after each clamps to its track. */
  bar: number;
}

const ROWS: Row[] = [
  // LIVE CONTROL — inside the band where the two rules already agreed. Green
  // before this change and green after; it is the row that says the repair did
  // not reach past the boundary.
  { what: 'CONTROL — inside the band both rules already agreed on', stored: 0.25, text: '25%', bar: 25 },
  // THE FORK objectui#8728 pinned and handed here. The chip read a stored 1 as
  // a ratio and said `100%` beside a full bar; every other band reads it as one
  // percentage point.
  { what: 'EXACTLY 1 — one percentage point, not one hundred', stored: 1, text: '1%', bar: 1 },
  // The far edge of the same boundary. `percentDisplayValue` passes -1 through;
  // the chip's rule scaled it to -100.
  { what: 'EXACTLY -1 — the symmetric edge the chip did not have', stored: -1, text: '-1%', bar: 0 },
  // Below -1. Bars are useless here (both clamp to an empty track), which is
  // why the text instrument exists.
  { what: 'below -1 — the half the bar cannot see', stored: -5, text: '-5%', bar: 0 },
];

describe('the summary chip reads the declared percent source (objectui#9071)', () => {
  it.each(ROWS)('$what: a stored $stored reads $text in BOTH places', ({ stored, text, bar }) => {
    const chip = renderChip(stored);
    cleanup();
    const cell = renderCell(stored);

    expect(
      chip.text,
      'THE PIN: the chip and the list cell state the same percentage for the same stored value',
    ).toBe(cell.text);
    expect(chip.text, 'and it is this percentage').toBe(text);
    expect(chip.bar, 'the chip draws what the cell draws').toBe(cell.bar);
    expect(chip.bar, 'and it is this magnitude').toBe(bar);
  });

  /**
   * The relation stated once over the whole table rather than row by row, so a
   * repair that fixed one row and broke another is red here even if someone
   * edited that row's expected string to match.
   */
  it('never states one percentage in the chip and another in the cell', () => {
    const disagreements = ROWS.filter(({ stored }) => {
      const chip = renderChip(stored);
      cleanup();
      const cell = renderCell(stored);
      cleanup();
      return chip.text !== cell.text || chip.bar !== cell.bar;
    });
    expect(disagreements.map((r) => r.stored), 'every stored value reads the same in both places').toEqual([]);
  });

  /**
   * ⚠️ THE HALF THIS CARD DOES NOT FIX, pinned so it cannot go quiet.
   *
   * `percentDisplayValue`'s doc comment requires a third surface to take BOTH
   * halves — the scaling AND the convention. This card moves the SCALING only,
   * because taking the convention half would change what the chip prints for
   * values it renders correctly today: the cell rounds to the field's precision
   * (0 by default) and groups through `Intl`, the chip states the full number
   * with a bare `%`. So a stored `12.3` still reads `12.3%` on the chip and
   * `12%` in the cell — DIFFERENT SPELLINGS OF THE SAME MAGNITUDE, which the
   * bars prove by agreeing exactly.
   */
  it('agrees on the magnitude even where the two surfaces spell it differently', () => {
    const chip = renderChip(12.3);
    cleanup();
    const cell = renderCell(12.3);

    expect(chip.bar, 'the scaling agrees — this is what objectui#9071 repaired').toBe(cell.bar);
    expect(chip.bar, 'both draw 12.3 points').toBe(12.3);
    expect(chip.text, 'the chip states the full number with a bare percent sign').toBe('12.3%');
    expect(cell.text, "the cell rounds to the field's precision and renders the locale's affix").toBe('12%');
  });
});
