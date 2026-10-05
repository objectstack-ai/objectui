/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11630 — the synthesizer CARRIES a field group's `visibleWhen` onto
 * the detail section that group produces, verbatim and unevaluated.
 *
 * The shared derivation (`deriveFieldGroupLayout`, `@objectstack/spec`) passes
 * the predicate through; `deriveFieldGroupDetailSections` used to rebuild each
 * section key by key and drop it, so `record:details` never saw the predicate
 * the entry form gates the same group with. Evaluation is the renderer's job
 * and is pinned beside it (`renderers/__tests__/record-details.groupVisibleWhen-11630.test.tsx`);
 * this file pins only the carriage, on both spellings the derivation admits.
 */

import { describe, it, expect } from 'vitest';
import {
  buildDefaultDetails,
  deriveFieldGroupDetailSections,
  type ObjectDefLike,
} from '../buildDefaultPageSchema';

const ENVELOPE = { dialect: 'cel', source: "record.kind == 'pro'" };
const BARE = "record.kind == 'pro'";

const defWith = (visibleWhen: unknown): ObjectDefLike => ({
  name: 'qa_group_gate4',
  fields: {
    kind: { name: 'kind', label: 'Kind', type: 'text' },
    pro_a: { name: 'pro_a', label: 'Pro A', type: 'text', group: 'pro' },
    notes: { name: 'notes', label: 'Notes', type: 'text', group: 'general' },
  },
  fieldGroups: [
    { key: 'general', label: 'General' },
    { key: 'pro', label: 'Pro details', ...(visibleWhen !== undefined ? { visibleWhen } : {}) } as any,
  ],
});

const byName = (sections: Array<Record<string, any>>, name: string | undefined) =>
  sections.find((s) => s.name === name);

describe('deriveFieldGroupDetailSections carries the group predicate (objectui#11630)', () => {
  it('the Expression envelope rides the gated section unchanged', () => {
    const sections = deriveFieldGroupDetailSections(defWith(ENVELOPE))!;
    expect(byName(sections, 'pro')!.visibleWhen).toEqual(ENVELOPE);
  });

  it('the bare-string spelling rides the gated section unchanged', () => {
    const sections = deriveFieldGroupDetailSections(defWith(BARE))!;
    expect(byName(sections, 'pro')!.visibleWhen).toBe(BARE);
  });

  it('a group without a predicate emits no key, and neither does the ungrouped bucket', () => {
    const sections = deriveFieldGroupDetailSections(defWith(ENVELOPE))!;
    // `general` declares no predicate; the trailing bucket (`kind`) is not a group.
    expect('visibleWhen' in byName(sections, 'general')!).toBe(false);
    const bucket = sections.find((s) => s.name === undefined)!;
    expect(bucket.fields.map((f: any) => f.name)).toEqual(['kind']);
    expect('visibleWhen' in bucket).toBe(false);
  });

  it('nothing changes for an object whose groups declare no predicate', () => {
    const sections = deriveFieldGroupDetailSections(defWith(undefined))!;
    expect(sections.some((s) => 'visibleWhen' in s)).toBe(false);
  });

  it('the published `record:details` node carries it — the shape the renderer and a Studio seed receive', () => {
    const node = buildDefaultDetails(defWith(ENVELOPE));
    expect(node.type).toBe('record:details');
    expect(byName(node.properties.sections, 'pro')!.visibleWhen).toEqual(ENVELOPE);
  });
});
