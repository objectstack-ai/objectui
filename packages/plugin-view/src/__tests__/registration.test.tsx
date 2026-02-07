/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { ObjectView, ViewSwitcher, FilterUI, SortUI } from '../index';

describe('Plugin View Registration', () => {
  it('exports ObjectView component', () => {
    expect(ObjectView).toBeDefined();
    expect(typeof ObjectView).toBe('function');
  });

  it('exports ViewSwitcher component', () => {
    expect(ViewSwitcher).toBeDefined();
    expect(typeof ViewSwitcher).toBe('function');
  });

  it('exports FilterUI component', () => {
    expect(FilterUI).toBeDefined();
    expect(typeof FilterUI).toBe('function');
  });

  it('exports SortUI component', () => {
    expect(SortUI).toBeDefined();
    expect(typeof SortUI).toBe('function');
  });
});
