// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#8676 — the object-metadata write invariant, pinned at the DOOR.
 *
 * The companion halves, each pinning something this file cannot:
 *
 *  - `object-metadata-write-guard.derivation.test.ts` DERIVES the relationship
 *    type set from the installed `@objectstack/spec` and asserts it equals the
 *    array the guard keeps, so the one list here cannot go stale silently.
 *  - `metadata-client.objectWriteGuard.test.ts` pins the DOOR: that
 *    `MetadataClient.save` reaches this function, and that a refused body issues
 *    NO REQUEST. A guard nothing calls is the defect objectui#8676 is about, so
 *    "the function refuses" and "the door calls it" are pinned apart on purpose.
 *  - `scripts/check-object-metadata-write-doors.mjs` answers COVERAGE — whether
 *    every door reaches it at all.
 *
 * ⚠ What every negative case below is measured against: a LIT CONTROL that runs
 * the same call with a usable target and observes it return. An assertion never
 * observed to pass on the accepting side would be satisfied by a guard that
 * refuses everything, which is the caricature this invariant must not become.
 */

import { describe, expect, it } from 'vitest';
import {
  assertObjectMetadataWritable,
  OBJECT_METADATA_TYPE,
  RELATIONSHIP_TYPES_REQUIRING_REFERENCE,
} from './object-metadata-write-guard';

const objectWith = (fields: unknown) => ({ name: 'account', label: 'Account', fields });

describe('assertObjectMetadataWritable — the four states of an unusable target', () => {
  // The four states the contract distinguishes, each measured against
  // `ObjectSchema` by the derivation pin. The guard must refuse all four,
  // because all four reach the server as the same 422.
  const unusable: Array<[string, unknown]> = [
    ['absent', undefined],
    ['null', null],
    ['empty string', ''],
    ['whitespace only', '   '],
  ];

  for (const [label, reference] of unusable) {
    it(`refuses a lookup whose reference is ${label}`, () => {
      const body = objectWith({
        title: { type: 'text', label: 'Title' },
        owner: reference === undefined
          ? { type: 'lookup', label: 'Owner' }
          : { type: 'lookup', label: 'Owner', reference },
      });
      expect(() => assertObjectMetadataWritable('object', body, 'TEST')).toThrow(/`owner`/);
    });
  }

  it('CONTROL — a usable target is written, so the guard is not simply always refusing', () => {
    const body = objectWith({
      title: { type: 'text', label: 'Title' },
      owner: { type: 'lookup', label: 'Owner', reference: 'account' },
    });
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).not.toThrow();
  });

  it('names WHICH of the four states it saw, so the message is actionable on screen', () => {
    const absent = objectWith({ owner: { type: 'lookup', label: 'Owner' } });
    const blank = objectWith({ owner: { type: 'lookup', label: 'Owner', reference: '   ' } });
    expect(() => assertObjectMetadataWritable('object', absent, 'TEST'))
      .toThrow(/no `reference` key at all/);
    expect(() => assertObjectMetadataWritable('object', blank, 'TEST'))
      .toThrow(/whitespace-only `reference`/);
  });

  it('names the door that refused, so a thrown message says where the write stopped', () => {
    const body = objectWith({ owner: { type: 'lookup', label: 'Owner' } });
    expect(() => assertObjectMetadataWritable('object', body, 'MetadataClient.save'))
      .toThrow(/^MetadataClient\.save refused/);
  });
});

describe('assertObjectMetadataWritable — every relationship type, and only those', () => {
  it('covers each member of the derived set rather than `lookup` alone', () => {
    // The set is not spelled here: this reads whatever the guard declares, so a
    // type added to it is covered by this pin the moment it is added.
    expect(RELATIONSHIP_TYPES_REQUIRING_REFERENCE.length).toBeGreaterThan(0);
    for (const type of RELATIONSHIP_TYPES_REQUIRING_REFERENCE) {
      const body = objectWith({ rel: { type, label: 'R' } });
      expect(() => assertObjectMetadataWritable('object', body, 'TEST')).toThrow(/`rel`/);
      const ok = objectWith({ rel: { type, label: 'R', reference: 'account' } });
      expect(() => assertObjectMetadataWritable('object', ok, 'TEST')).not.toThrow();
    }
  });

  it('says nothing about a NON-relationship field with no reference', () => {
    // ⛔ The counter-case to a guard that drifted into revalidating the document:
    // a `text` field has no target and must sail straight through.
    const body = objectWith({ title: { type: 'text', label: 'Title' } });
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).not.toThrow();
  });
});

describe('assertObjectMetadataWritable — both `fields` shapes a writer can hand the door', () => {
  it('reads the ARRAY shape, which one whole designer surface PUTs verbatim', () => {
    const body = objectWith([
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'owner', type: 'lookup', label: 'Owner' },
    ]);
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).toThrow(/`owner`/);
  });

  it('CONTROL — the same array with a usable target passes', () => {
    const body = objectWith([
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'owner', type: 'lookup', label: 'Owner', reference: 'account' },
    ]);
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).not.toThrow();
  });

  it('names an array entry by its POSITION when it carries no name', () => {
    const body = objectWith([{ type: 'lookup', label: 'Owner' }]);
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).toThrow(/\[0\]/);
  });
});

describe('assertObjectMetadataWritable — everything it deliberately does not judge', () => {
  it('is a no-op for every metadata type other than `object`', () => {
    // This door serves `view`, `app`, `flow`, `hook`, `permission` and
    // `dashboard` writes too. A `lookup`-shaped key inside one of those is not
    // this invariant's business, and refusing it would be the door overreaching.
    const body = objectWith({ owner: { type: 'lookup', label: 'Owner' } });
    for (const type of ['view', 'app', 'flow', 'permission', 'hook', 'dashboard']) {
      expect(() => assertObjectMetadataWritable(type, body, 'TEST')).not.toThrow();
    }
    // ...and the constant naming the one type it does judge is the same one.
    expect(() => assertObjectMetadataWritable(OBJECT_METADATA_TYPE, body, 'TEST')).toThrow();
  });

  it('is a no-op for a body that carries no readable `fields`', () => {
    for (const body of [undefined, null, 'not an object', 42, {}, { fields: null }, { fields: 7 }]) {
      expect(() => assertObjectMetadataWritable('object', body, 'TEST')).not.toThrow();
    }
  });

  it('⛔ does NOT strip the offending field and report success', () => {
    // objectstack#4001's silent-drop shape, ruled out for this family twice.
    // The body must come back unchanged; the only outcome is a throw.
    const fields = { owner: { type: 'lookup', label: 'Owner' } };
    const body = objectWith(fields);
    expect(() => assertObjectMetadataWritable('object', body, 'TEST')).toThrow();
    expect(body.fields).toBe(fields);
    expect(Object.keys(fields)).toEqual(['owner']);
  });
});
