// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#8676 — the guard's ONE list is derived from the installed contract on
 * every run, never recalled.
 *
 * ## Why this file is the point rather than a formality
 *
 * The card this guard closes is about an enumeration that went stale while
 * nothing said so. `RELATIONSHIP_TYPES_REQUIRING_REFERENCE` is the only
 * enumeration the fix itself keeps, so it does not get to be exempt from the
 * card's own lesson. This re-derives it from `@objectstack/spec` — parsing a
 * minimal `{ type, label }` document for EVERY member of `FieldType` and keeping
 * the types the contract refuses at path `reference` — and asserts the guard's
 * array equals that. A spec release that makes a third field type require a
 * target turns this red, which is precisely what nothing did for the writers.
 *
 * ⚠ The derivation carries its own controls. A probe that refuses everything, or
 * accepts everything, would also "agree" with some array, so the run asserts
 * that the population is non-trivial and that a type OUTSIDE the derived set
 * parses green on the same minimal document.
 *
 * ⛔ Deliberately a TEST and not a runtime probe. Parsing 50 documents on the way
 * to every save pays a hot-path cost to re-learn something that changes at most
 * once per spec release, and a runtime probe that throws must choose between
 * blocking writes and failing open. A pin has neither problem: it fails at CI
 * time with nothing at stake.
 */

import { describe, expect, it } from 'vitest';
import { FieldSchema, FieldType, ObjectSchema } from '@objectstack/spec/data';
import { RELATIONSHIP_TYPES_REQUIRING_REFERENCE } from './object-metadata-write-guard';

/** Every field type the installed contract refuses for want of a `reference`. */
function deriveTypesRequiringReference(): string[] {
  const derived: string[] = [];
  for (const type of FieldType.options) {
    const result = FieldSchema.safeParse({ type, label: 'L' });
    if (result.success) continue;
    if (result.error.issues.some((issue) => issue.path.join('.') === 'reference')) derived.push(type);
  }
  return derived;
}

describe('RELATIONSHIP_TYPES_REQUIRING_REFERENCE — derived from the installed spec', () => {
  it('is exactly the set the contract refuses at `reference`', () => {
    const derived = deriveTypesRequiringReference();
    expect([...RELATIONSHIP_TYPES_REQUIRING_REFERENCE].sort()).toEqual([...derived].sort());
  });

  it('CONTROL — the probe is neither refusing nor accepting everything', () => {
    const derived = deriveTypesRequiringReference();
    // Non-trivial on both sides: some types are in, most are not. Without this,
    // a probe that collapsed to "all" or "none" could still agree with an array.
    expect(derived.length).toBeGreaterThan(0);
    expect(derived.length).toBeLessThan(FieldType.options.length);
    expect(FieldType.options.length).toBeGreaterThan(10);
  });

  it('CONTROL — a type outside the derived set parses green on the same document', () => {
    const outside = FieldType.options.filter((type) => !RELATIONSHIP_TYPES_REQUIRING_REFERENCE.includes(type));
    expect(outside.length).toBeGreaterThan(0);
    expect(FieldSchema.safeParse({ type: 'text', label: 'L' }).success).toBe(true);
  });
});

describe('the four target states, measured against the contract rather than asserted', () => {
  // The guard's message distinguishes four states. This is where the claim that
  // all four are REFUSED BY THE SERVER is re-measured, so the guard's "it
  // forecloses nothing the server would have taken" argument stays checkable.
  const cases: Array<[string, Record<string, unknown>]> = [
    ['absent', { type: 'lookup', label: 'L' }],
    ['null', { type: 'lookup', label: 'L', reference: null }],
    ['empty string', { type: 'lookup', label: 'L', reference: '' }],
    ['whitespace only', { type: 'lookup', label: 'L', reference: '   ' }],
  ];

  for (const [label, field] of cases) {
    it(`the contract refuses a lookup whose reference is ${label}`, () => {
      const result = ObjectSchema.safeParse({ name: 'account', label: 'A', fields: { rel: field } });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('fields.rel.reference');
    });
  }

  it('CONTROL — a usable target is ACCEPTED by the same schema on the same document', () => {
    const result = ObjectSchema.safeParse({
      name: 'account',
      label: 'A',
      fields: { rel: { type: 'lookup', label: 'L', reference: 'contact' } },
    });
    expect(result.success).toBe(true);
  });
});
