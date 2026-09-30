/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10783 — an identity-only inline grid column over a `currency` child
 * field that carries a `scale` is REPORTED, and the `scale` no longer decides
 * its width.
 *
 * `@objectstack/spec` 17.5.0 refuses `scale` on an inline grid column that
 * declares `type: 'currency'`. A column that declares no `type`
 * (`{ name: 'amount', scale: 2 }`) still parses: `hydrateColumns` fills its
 * `type` from the child field at render time, which the spec cannot see, and
 * `objectui validate` cannot either (a subform's `columns` is
 * `z.array(z.any())`, and the child object's fields are not in the document).
 * `GridField`'s `currencyWidth` no longer reads a currency column's `scale`, so
 * without a report here the key would be accepted everywhere and read by
 * nothing.
 *
 * Every test names its own child object: the report is once per column per
 * page load, so a shared name would let one test's report hide another's.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeRow } from '@object-ui/fields';
import { hydrateColumns } from './deriveMasterDetail';

/** An invoice line: `amount = quantity * unit_price` is a currency field. */
const lineSchema = (name: string) => ({
  name,
  fields: {
    quantity: { type: 'number', label: 'Qty' },
    unit_price: { type: 'currency', label: 'Unit Price' },
    amount: { type: 'currency', label: 'Amount', expression: 'quantity * unit_price' },
    weight: { type: 'number', label: 'Weight', expression: 'quantity * unit_price' },
  },
});

/** Every `console.warn` message this test's calls produced. */
function spyWarn() {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  return () => spy.mock.calls.map((args) => String(args[0]));
}

afterEach(() => vi.restoreAllMocks());

describe('hydrateColumns reports a `scale` on a column that hydrates to currency (objectui#10783)', () => {
  it('an identity-only column over a currency child field with `scale` is reported, naming the column and the child object', () => {
    const warnings = spyWarn();
    const [col] = hydrateColumns([{ name: 'amount', scale: 2 }], lineSchema('line_reported'));
    expect(col.type).toBe('currency');
    const reports = warnings().filter((m) => m.includes('`scale`'));
    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain("'amount'");
    expect(reports[0]).toContain("'line_reported'");
    expect(reports[0]).toContain('`currency`');
  });

  it("and the hydrated column's `scale` no longer decides its width: the currency's minor unit does", () => {
    spyWarn();
    const cols = hydrateColumns([{ name: 'quantity' }, { name: 'unit_price' }, { name: 'amount', scale: 2 }], lineSchema('line_width'));
    // JPY has no minor digits; `scale: 2` would have stored 1234.57.
    expect(computeRow(cols, { quantity: 3, unit_price: 411.523 }, 'JPY').amount).toBe(1235);
    // KWD has three; `scale: 2` would have stored 3.7.
    expect(computeRow(cols, { quantity: 3, unit_price: 1.2345 }, 'KWD').amount).toBe(3.704);
  });

  it('a declared currency column carrying `scale` is reported too (the form-view `subforms[].columns` path the spec does not judge)', () => {
    const warnings = spyWarn();
    hydrateColumns([{ name: 'amount', type: 'currency', computed: true, expr: 'quantity * unit_price', scale: 2 }], lineSchema('line_declared'));
    const reports = warnings().filter((m) => m.includes('`scale`'));
    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain("'amount'");
    expect(reports[0]).toContain("'line_declared'");
  });

  it('is reported once per column, not on every child-schema resolve', () => {
    const warnings = spyWarn();
    hydrateColumns([{ name: 'amount', scale: 2 }], lineSchema('line_once'));
    hydrateColumns([{ name: 'amount', scale: 2 }], lineSchema('line_once'));
    expect(warnings().filter((m) => m.includes('`scale`'))).toHaveLength(1);
  });

  it('control: a currency column with no `scale` is not reported', () => {
    const warnings = spyWarn();
    hydrateColumns([{ name: 'amount' }, { name: 'unit_price', type: 'currency' }], lineSchema('line_no_scale'));
    expect(warnings()).toEqual([]);
  });

  it('control: a `scale` on a column that hydrates to `number` is not reported, and still decides its width', () => {
    const warnings = spyWarn();
    const cols = hydrateColumns([{ name: 'quantity' }, { name: 'unit_price' }, { name: 'weight', scale: 2 }], lineSchema('line_number'));
    expect(warnings()).toEqual([]);
    expect(cols[2].type).toBe('number');
    expect(computeRow(cols, { quantity: 3, unit_price: 411.523 }, 'JPY').weight).toBe(1234.57);
  });
});
