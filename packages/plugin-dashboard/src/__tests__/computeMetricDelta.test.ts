/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { computeMetricDelta } from '../utils';

describe('computeMetricDelta', () => {
  it('returns null when previousValue is missing', () => {
    expect(computeMetricDelta(100, null)).toBeNull();
    expect(computeMetricDelta(100, undefined)).toBeNull();
  });

  it('returns null when current is not a finite number', () => {
    expect(computeMetricDelta(null, 100)).toBeNull();
    expect(computeMetricDelta(undefined, 100)).toBeNull();
    expect(computeMetricDelta(NaN, 100)).toBeNull();
    expect(computeMetricDelta(Infinity, 100)).toBeNull();
  });

  it('computes positive delta', () => {
    expect(computeMetricDelta(120, 100)).toEqual({ value: 20, direction: 'up' });
  });

  it('computes negative delta', () => {
    expect(computeMetricDelta(80, 100)).toEqual({ value: 20, direction: 'down' });
  });

  it('returns neutral on equal values', () => {
    expect(computeMetricDelta(50, 50)).toEqual({ value: 0, direction: 'neutral' });
  });

  describe('previousValue === 0', () => {
    it('returns neutral when both are 0', () => {
      expect(computeMetricDelta(0, 0)).toEqual({ value: 0, direction: 'neutral' });
    });
    it('returns 100% up when current is positive', () => {
      expect(computeMetricDelta(42, 0)).toEqual({ value: 100, direction: 'up' });
    });
    it('returns 100% down when current is negative', () => {
      expect(computeMetricDelta(-42, 0)).toEqual({ value: 100, direction: 'down' });
    });
  });

  describe('negative previousValue', () => {
    it('uses abs(previous) as denominator so improvement reads as positive', () => {
      // -10 → -5 : (delta = 5 / 10 = 50% up)
      expect(computeMetricDelta(-5, -10)).toEqual({ value: 50, direction: 'up' });
    });

    it('worsening reads as negative', () => {
      // -10 → -15: (delta = -5 / 10 = 50% down)
      expect(computeMetricDelta(-15, -10)).toEqual({ value: 50, direction: 'down' });
    });
  });
});
