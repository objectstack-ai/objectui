// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The marketplace card's id is cut in the middle, never at its end
 * (objectui#12616): a card too narrow for the whole manifest id keeps its head
 * and its package suffix with "…" between, so the part that tells two packages
 * apart stays readable. One helper does the cut for every card; these cases pin
 * it. The card keeps the whole id in the element's `title`
 * (`MarketplacePage.cardHeader-12616.test.tsx`).
 */

import { describe, expect, it } from 'vitest';
import { MIDDLE_ELLIPSIS, middleTruncate } from '../middleTruncate';

describe('middleTruncate (objectui#12616)', () => {
  it('a long id keeps its head and its package suffix, with "…" between', () => {
    const cut = middleTruncate('app.objectstack.hotcrm', 20);
    expect(cut).toBe('app.objectsta…hotcrm');
    expect(Array.from(cut)).toHaveLength(20);
    expect(cut.split(MIDDLE_ELLIPSIS)).toEqual(['app.objectsta', 'hotcrm']);
  });

  it('a short id is untouched, up to and including the budget', () => {
    expect(middleTruncate('com.example.crm', 20)).toBe('com.example.crm');
    const exact = 'app.objectstack.crm1';
    expect(exact).toHaveLength(20);
    expect(middleTruncate(exact, 20)).toBe(exact);
  });

  it('a suffix too long to keep whole keeps its own end and leaves the head a third of the room', () => {
    expect(middleTruncate('com.northwind.customer-relationship-suite', 20)).toBe('com.nor…onship-suite');
  });

  it('an id with no "." splits the room in half', () => {
    expect(middleTruncate('abcdefghijklmnopqrstuvwxyz', 11)).toBe('abcde…vwxyz');
  });

  it('counts by code point, so a surrogate pair is never cut in two', () => {
    const astral = '\u{1F4E6}';
    const cut = middleTruncate(`${astral.repeat(10)}.pkg`, 9);
    expect(cut).toBe(`${astral.repeat(5)}${MIDDLE_ELLIPSIS}pkg`);
    expect(Array.from(cut)).toHaveLength(9);
  });

  it('refuses a budget that cannot hold a head, the ellipsis and a tail', () => {
    expect(() => middleTruncate('app.objectstack.hotcrm', 2)).toThrow(RangeError);
    expect(() => middleTruncate('app.objectstack.hotcrm', 7.5)).toThrow(RangeError);
  });
});
