// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { describe, it, expect } from 'vitest';
import { OWD_MODELS, deriveMasterObject } from './owd-sharing';

describe('owd-sharing — canonical values (ADR-0090 D4)', () => {
  it('offers exactly the four canonical models', () => {
    expect([...OWD_MODELS]).toEqual([
      'private',
      'public_read',
      'public_read_write',
      'controlled_by_parent',
    ]);
  });
});

describe('owd-sharing — deriveMasterObject', () => {
  it('reads the master-detail reference from a keyed-map fields shape', () => {
    const fields = {
      name: { type: 'text' },
      account: { type: 'master_detail', reference: 'crm_account' },
    };
    expect(deriveMasterObject(fields)).toBe('crm_account');
  });

  it('reads it from an array fields shape', () => {
    const fields = [
      { name: 'name', type: 'text' },
      { name: 'parent', type: 'master_detail', reference: 'crm_case' },
    ];
    expect(deriveMasterObject(fields)).toBe('crm_case');
  });

  it('returns undefined when there is no master-detail field', () => {
    expect(deriveMasterObject({ name: { type: 'text' } })).toBeUndefined();
    expect(deriveMasterObject(undefined)).toBeUndefined();
    // A master-detail field without a reference target resolves to undefined.
    expect(deriveMasterObject({ p: { type: 'master_detail' } })).toBeUndefined();
  });
});
