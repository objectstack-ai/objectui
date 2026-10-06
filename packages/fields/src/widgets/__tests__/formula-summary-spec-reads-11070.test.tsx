/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The `formula` and `summary` widgets format a value by the SPEC spellings,
 * and only by those (objectui#11070, round 3; the seat's answer A).
 *
 * `@objectstack/spec`'s `FieldSchema` carries a formula's result type as
 * `returnType` and a roll-up as `summaryOperations: { object, field, function }`
 * — the spellings object metadata carries (the example apps write them, and
 * the metadata admin stamps `returnType` from the inferred CEL type). The two
 * widgets used to read only the snake_case `return_type` / `summary_type`, so
 * on an object-bound form a formula or summary field rendered without its
 * type formatting. The snake_case reads are retired at once, with no dual
 * read.
 *
 * Each case below has a control that changes only the key under test, so a
 * green reads "the widget consumed the spec key", never "the default happened
 * to match". The last block pins the retirement: a snake_case spelling alone
 * no longer formats anything.
 *
 * The annotated literals are judged by TypeScript's excess-property check
 * (`tsc -p tsconfig.test.json`), which refuses the retired members by name.
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import type { FormulaFieldMetadata, SummaryFieldMetadata } from '@object-ui/types';

import { FormulaField } from '../FormulaField';
import { SummaryField } from '../SummaryField';

const noop = () => {};

const formulaText = (field: FormulaFieldMetadata, value: unknown) =>
  render(<FormulaField value={value} onChange={noop} field={field} />).container.textContent;

const summaryText = (field: SummaryFieldMetadata, value: unknown) =>
  render(<SummaryField value={value} onChange={noop} field={field} />).container.textContent;

describe('objectui#11070 — `FormulaField` formats by the spec `returnType`', () => {
  // The number face is the number field's since objectui#11748 (grouped, at a
  // declared `scale`), not `toFixed(2)`. The control is a numeric STRING: the
  // declaration reads it as a number, while with no `returnType` only a JS
  // number is one, so a string of digits prints as text.
  it('`returnType: number` reads a numeric string as a number; with no `returnType` it prints as text', () => {
    expect(formulaText({ type: 'formula', name: 'total', returnType: 'number' }, '1234.5')).toBe('1,234.5');
    expect(formulaText({ type: 'formula', name: 'total' }, '1234.5')).toBe('1234.5');
  });

  it('`returnType: boolean` prints Yes / No; `returnType: text` prints the raw value', () => {
    expect(formulaText({ type: 'formula', name: 'overdue', returnType: 'boolean' }, true)).toBe('Yes');
    expect(formulaText({ type: 'formula', name: 'overdue', returnType: 'boolean' }, false)).toBe('No');
    expect(formulaText({ type: 'formula', name: 'overdue', returnType: 'text' }, true)).toBe('true');
  });
});

describe('objectui#11070 — `SummaryField` formats by `summaryOperations.function`', () => {
  const rollUp = (fn: 'count' | 'sum' | 'avg' | 'min' | 'max'): SummaryFieldMetadata => ({
    type: 'summary',
    name: 'line_total',
    summaryOperations: { object: 'order_line', field: 'amount', function: fn },
  });

  it.each(['sum', 'avg', 'min', 'max'] as const)('`function: %s` formats to two decimals', (fn) => {
    expect(summaryText(rollUp(fn), 15750.5)).toBe('15750.50');
  });

  it('`function: count` prints the value as it arrives, as does a field with no roll-up', () => {
    expect(summaryText(rollUp('count'), 42)).toBe('42');
    expect(summaryText({ type: 'summary', name: 'line_total' }, 15750.5)).toBe('15750.5');
  });
});

describe('objectui#11070 — the snake_case spellings are retired: alone, they format nothing', () => {
  // A numeric STRING, not a JS number: since objectui#11748 an undeclared JS
  // number reads as a number too, so a number could not tell a read
  // `return_type` from an ignored one.
  it('`return_type` is not read', () => {
    const legacy = { type: 'formula', name: 'total', return_type: 'number' } as unknown as FormulaFieldMetadata;
    expect(formulaText(legacy, '1234.5')).toBe('1234.5');
  });

  it('`summary_type` is not read', () => {
    const legacy = { type: 'summary', name: 'line_total', summary_type: 'sum' } as unknown as SummaryFieldMetadata;
    expect(summaryText(legacy, 15750.5)).toBe('15750.5');
  });
});
