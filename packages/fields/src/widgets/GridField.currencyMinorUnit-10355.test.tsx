/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10355 — a computed `currency` cell in the line-item grid is STORED
 * at its currency's ISO 4217 minor unit and SHOWN in that currency.
 *
 * `computeRow` rounded a computed currency column to `scale ?? 2`: it read the
 * `scale` that ruling B (objectstack-ai/objectstack#19629) retired from the
 * currency type, and it gave every currency on earth two decimals. So a yen
 * amount was stored with cents yen does not have, and a dinar amount lost its
 * third digit. The display faces fell back to a literal `¥` without resolving
 * any currency. A currency's decimal places are the currency's, not a setting
 * (ruling 乙 on objectstack-ai/objectstack#19910).
 *
 * The currency is the grid's resolved one (`resolveFieldCurrency`, which lands
 * on the tenant default here), so every pin below declares it the way a real
 * session does: through `LocalizationProvider`, or `computeRow`'s tenant
 * argument for the pure half.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';
import { LocalizationProvider } from '@object-ui/i18n';
import { GridField, computeRow, type GridColumn } from './GridField';

afterEach(() => cleanup());

/** `Intl` separates a code from its amount with a no-break space. */
const flat = (s: string | null | undefined): string => (s ?? '').replace(/\u00a0/g, ' ').trim();

/** The master-detail line: `amount = quantity * unit_price`. */
const amountColumn = (extra: Partial<GridColumn> = {}): GridColumn => ({
  name: 'amount',
  label: 'Amount',
  type: 'currency',
  computed: true,
  expr: 'record.quantity * record.unit_price',
  ...extra,
});

describe('computeRow stores a computed currency cell at its currency minor unit (objectui#10355)', () => {
  it('JPY: the stored amount is a whole number of yen', () => {
    const next = computeRow([amountColumn()], { quantity: 3, unit_price: 1234.5 }, 'JPY');
    expect(next.amount).toBe(3704);
    expect(Number.isInteger(next.amount)).toBe(true);
  });

  it('KWD: the stored amount keeps its third minor digit', () => {
    const next = computeRow([amountColumn()], { quantity: 3, unit_price: 1.2345 }, 'KWD');
    expect(next.amount).toBe(3.704);
  });

  it('USD control: the stored amount keeps two places', () => {
    const next = computeRow([amountColumn()], { quantity: 3, unit_price: 411.523 }, 'USD');
    expect(next.amount).toBe(1234.57);
  });

  it('an authored `scale` on a currency column wins over the minor unit', () => {
    // `InlineGridColumnSchema.scale` declares it for a computed
    // "numeric/currency result", so the minor unit replaces only the old
    // default of 2, never a declared width.
    expect(computeRow([amountColumn({ scale: 2 })], { quantity: 3, unit_price: 411.523 }, 'JPY').amount).toBe(1234.57);
    expect(computeRow([amountColumn({ scale: 0 })], { quantity: 3, unit_price: 411.523 }, 'USD').amount).toBe(1235);
  });

  it('no currency resolved: stored as computed, never at an invented two places', () => {
    const next = computeRow([amountColumn()], { quantity: 3, unit_price: 1.2345 });
    expect(next.amount).toBe(3 * 1.2345);
  });

  it('number control: a computed number column with no `scale` stays unrounded', () => {
    const next = computeRow([amountColumn({ type: 'number' })], { quantity: 3, unit_price: 1.2345 }, 'JPY');
    expect(next.amount).toBe(3 * 1.2345);
  });
});

const lineColumns: GridColumn[] = [
  { name: 'quantity', label: 'Qty', type: 'number' },
  { name: 'unit_price', label: 'Unit Price', type: 'currency' },
  amountColumn(),
];

function lineGrid(currency: string | undefined, props: Partial<React.ComponentProps<typeof GridField>> = {}) {
  const onChange = vi.fn();
  render(
    <LocalizationProvider value={{ currency, locale: 'en' }}>
      <GridField value={[]} onChange={onChange} field={{ columns: lineColumns } as never} {...props} />
    </LocalizationProvider>,
  );
  return onChange;
}

describe('GridField shows a currency cell in its resolved currency (objectui#10355)', () => {
  it('JPY: an edit stores whole yen and the computed cell shows no decimals', () => {
    const onChange = lineGrid('JPY', {
      value: [{ quantity: 2, unit_price: 1234.5, amount: 2469 }],
    });
    fireEvent.change(screen.getAllByLabelText('Qty')[0], { target: { value: '3' } });
    const stored = (onChange.mock.calls.at(-1)![0] as Record<string, unknown>[])[0];
    expect(stored.amount).toBe(3704);
    cleanup();

    lineGrid('JPY', { value: [stored] });
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('¥3,704');
    cleanup();

    // A row stored with cents before this repair shows at the yen's width too.
    lineGrid('JPY', { value: [{ quantity: 3, unit_price: 1234.5, amount: 3703.5 }] });
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('¥3,704');
  });

  it('KWD: the computed cell shows three decimals in dinar', () => {
    lineGrid('KWD', { value: [{ quantity: 3, unit_price: 1.2345, amount: 3.704 }] });
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('KWD 3.704');
  });

  it('USD: the list face and the edit adornment say `$`, never a default `¥`', () => {
    lineGrid('USD', {
      value: [{ quantity: 3, unit_price: 411.523, amount: 1234.57 }],
      displayMode: 'list',
      onRowExpand: () => {},
    });
    const text = flat(document.body.textContent);
    expect(text).toContain('$1,234.57');
    expect(text).not.toContain('¥');
    cleanup();

    lineGrid('USD', { value: [{ quantity: 3, unit_price: 411.523, amount: 1234.57 }] });
    const input = screen.getAllByLabelText('Unit Price')[0];
    expect(flat(input.parentElement?.textContent)).toBe('$');
  });

  it('no currency resolved: no symbol at all, on either face', () => {
    lineGrid(undefined, { value: [{ quantity: 3, unit_price: 1.25, amount: 3.75 }] });
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('3.75');
    expect(flat(screen.getAllByLabelText('Unit Price')[0].parentElement?.textContent)).toBe('');
  });

  it('an authored `scale` also decides the currency cell display width', () => {
    lineGrid('JPY', { value: [{ quantity: 3, unit_price: 411.523, amount: 1234.57 }] });
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('¥1,235');
    cleanup();

    render(
      <LocalizationProvider value={{ currency: 'JPY', locale: 'en' }}>
        <GridField
          value={[{ quantity: 3, unit_price: 411.523, amount: 1234.57 }]}
          onChange={() => {}}
          field={{ columns: [lineColumns[0], lineColumns[1], amountColumn({ scale: 2 })] } as never}
        />
      </LocalizationProvider>,
    );
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('¥1,234.57');
  });

  it('an authored currency `scale` above the engine ceiling is clamped on the display too (objectui#10071)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(() =>
        render(
          <LocalizationProvider value={{ currency: 'USD', locale: 'en' }}>
            <GridField
              value={[{ quantity: 3, unit_price: 1.25, amount: 3.75 }]}
              onChange={() => {}}
              field={{ columns: [lineColumns[0], lineColumns[1], amountColumn({ scale: 105 })] } as never}
            />
          </LocalizationProvider>,
        ),
      ).not.toThrow();
      const said = warn.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(said).toContain('105');
      expect(said).toContain('objectui#10071');
    } finally {
      warn.mockRestore();
    }
  });

  it('an authored `prefix` replaces the symbol but not the width', () => {
    const onChange = vi.fn();
    render(
      <LocalizationProvider value={{ currency: 'KWD', locale: 'en' }}>
        <GridField
          value={[{ quantity: 3, unit_price: 1.2, amount: 3.6 }]}
          onChange={onChange}
          field={{ columns: [lineColumns[0], { ...lineColumns[1], prefix: 'KD ' }, amountColumn({ prefix: 'KD ' })] } as never}
        />
      </LocalizationProvider>,
    );
    // Three places: the dinar's width, padded, under the authored symbol.
    expect(flat(document.querySelector('[data-computed="amount"]')?.textContent)).toBe('KD 3.600');
    expect(flat(screen.getAllByLabelText('Unit Price')[0].parentElement?.textContent)).toBe('KD');
  });
});
