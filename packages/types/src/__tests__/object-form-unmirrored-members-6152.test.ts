/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#6152 round 1 — the `ObjectFormSchema` members the TypeScript face
 * declared and the zod mirror had never heard of.
 *
 * ## The defect
 *
 * `UnmirroredDeclared['objectql.zod.ts#ObjectFormSchema']` in
 * `zod-mirror-parity.test.ts` recorded keys `../objectql.ts` invites an author
 * to write and `../zod/objectql.zod.ts` did not declare. Two faces paid for it:
 *
 *   - the TOLERANT face (`BaseSchema` is `.passthrough()`) kept any value at
 *     those keys unexamined, so `{ formType: 'carousel' }` parsed green and
 *     `ObjectForm` fell through to its simple layout;
 *   - the STRICT authoring face (`StrictAnyComponentSchema`, objectui#8345,
 *     derived from the mirrors) refused the keys outright, although `tsc`
 *     accepted them — objectui#5250's M3 class (iii), the refusals
 *     `objectui validate` would print wrongly once it judges strict.
 *
 * Each key was measured before it was mirrored: authored (a document, the
 * object-view `form` slot, or a form view relayed into the node), and READ by a
 * shipped renderer (`ObjectForm` in `@object-ui/plugin-form`). The readings are
 * in objectui#6152's round-1 report; this file pins the result, not the census.
 *
 * ## What each row asserts
 *
 *   - a VALID authored value parses on BOTH faces — the strict leg is the one
 *     that moved (refused → accepted), the tolerant leg shows the shape is not a
 *     broken schema;
 *   - a WRONG-TYPED value is refused AT THE KEY on the tolerant face — the leg
 *     that moved the other way (kept unexamined → refused).
 *
 * `open` and `submitHandler` stay out of the mirror on purpose (their routes are
 * open on objectui#6152; objectui#6182 rules out a string handler), and a row
 * holds them out so a later card cannot mirror them without that ruling.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ObjectFormSchema as ObjectFormMirror } from '../zod/objectql.zod.js';
import { AnyComponentSchema, StrictAnyComponentSchema } from '../zod/index.zod.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');

/** A minimal document both faces accept; every row below is a delta on it. */
const BASE = { type: 'object-form', objectName: 'order', mode: 'create' } as const;

/** Each mirrored key: one authored value, and one value its declaration refuses. */
const ROWS: ReadonlyArray<{ key: string; valid: unknown; wrong: unknown }> = [
  { key: 'formType', valid: 'wizard', wrong: 'carousel' },
  {
    key: 'sections',
    valid: [
      { name: 'basics', label: 'Basics', columns: 2, fields: ['name', { name: 'email', type: 'email' }] },
      { group: 'contact_info', pane: 'secondary', visibleWhen: { dialect: 'cel', source: 'record.kind == "b2b"' } },
    ],
    wrong: 'basics',
  },
  { key: 'defaultTab', valid: 'basics', wrong: 3 },
  { key: 'tabPosition', valid: 'left', wrong: 'middle' },
  { key: 'allowSkip', valid: true, wrong: 'yes' },
  { key: 'showStepIndicator', valid: false, wrong: 'no' },
  { key: 'nextText', valid: { en: 'Next', fr: 'Suivant' }, wrong: 42 },
  { key: 'prevText', valid: 'Back', wrong: 42 },
  { key: 'splitDirection', valid: 'vertical', wrong: 'diagonal' },
  { key: 'splitSize', valid: 40, wrong: '40%' },
  { key: 'splitResizable', valid: false, wrong: 'false' },
  { key: 'drawerSide', valid: 'left', wrong: 'center' },
  { key: 'drawerWidth', valid: '40%', wrong: 40 },
  { key: 'modalSize', valid: 'lg', wrong: 'huge' },
  { key: 'modalCloseButton', valid: false, wrong: 'no' },
  { key: 'mobile', valid: { stickyActions: true, stepper: 'auto', stepperMinFields: 6 }, wrong: { stepper: 'sometimes' } },
  { key: 'buttons', valid: { submit: { show: true, label: 'Save' }, reset: { show: false } }, wrong: { submit: { show: 'yes' } } },
  { key: 'defaults', valid: { status: 'open', priority: 2 }, wrong: ['status'] },
  { key: 'subforms', valid: [{ childObject: 'order_line', minRows: 1 }], wrong: [{ relationshipField: 'order' }] },
];

describe('objectui#6152 round 1 — `object-form` members the mirror now declares', () => {
  it('CONTROL: the minimal document parses on both faces', () => {
    expect(AnyComponentSchema.safeParse(BASE).success).toBe(true);
    expect(StrictAnyComponentSchema.safeParse(BASE).success).toBe(true);
  });

  it.each(ROWS)('`$key` is a member of the mirror', ({ key }) => {
    expect(key in (ObjectFormMirror.shape as Record<string, unknown>)).toBe(true);
  });

  it.each(ROWS)('an authored `$key` parses on the strict face and the tolerant face', ({ key, valid }) => {
    const doc = { ...BASE, [key]: valid };
    const strict = StrictAnyComponentSchema.safeParse(doc);
    expect(strict.success, JSON.stringify(strict.error?.issues)).toBe(true);
    const tolerant = AnyComponentSchema.safeParse(doc);
    expect(tolerant.success, JSON.stringify(tolerant.error?.issues)).toBe(true);
  });

  it.each(ROWS)('a wrong-typed `$key` is refused at the key on the tolerant face', ({ key, wrong }) => {
    const parsed = ObjectFormMirror.safeParse({ ...BASE, [key]: wrong });
    expect(parsed.success).toBe(false);
    for (const issue of parsed.error?.issues ?? []) expect(issue.path[0]).toBe(key);
  });

  it('the object-view `form` slot takes the same members (it is this mirror minus the identity keys)', () => {
    const doc = { type: 'object-view', objectName: 'order', form: { formType: 'drawer', drawerSide: 'left', sections: [{ fields: ['name'] }] } };
    const strict = StrictAnyComponentSchema.safeParse(doc);
    expect(strict.success, JSON.stringify(strict.error?.issues)).toBe(true);
    expect(AnyComponentSchema.safeParse({ ...doc, form: { formType: 'carousel' } }).success).toBe(false);
  });

  it('a section is a closed shape on the strict face: an undeclared section key is named there', () => {
    // `className` is deliberately undeclared on `ObjectFormSection` (objectui#7200).
    const strict = StrictAnyComponentSchema.safeParse({ ...BASE, sections: [{ name: 'a', className: 'p-4', fields: ['a'] }] });
    expect(strict.success).toBe(false);
    expect(JSON.stringify(strict.error?.issues)).toContain('"className"');
  });

  it('the catalog document objectui#5250 M3 charged with three of these keys now parses on the strict face', () => {
    const doc = JSON.parse(readFileSync(join(REPO_ROOT, 'examples/schema-catalog/src/schemas/plugin-form/object-form-tabbed-sections.json'), 'utf8'));
    // Non-vacuity: the document really carries the keys this row is about.
    expect(Object.keys(doc)).toEqual(expect.arrayContaining(['formType', 'defaultTab', 'sections']));
    const strict = StrictAnyComponentSchema.safeParse(doc);
    expect(strict.success, JSON.stringify(strict.error?.issues)).toBe(true);
  });

  it('`open` and `submitHandler` stay out of the mirror until their routes are ruled', () => {
    const shape = ObjectFormMirror.shape as Record<string, unknown>;
    expect('open' in shape).toBe(false);
    expect('submitHandler' in shape).toBe(false);
  });
});
