/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8355 — THE SECOND ROUTE to `ObjectCalendar`, and the one the first
 * two rounds of this card missed.
 *
 * `generateViewSchema` runs precisely when no host supplied `renderListView` —
 * the authored `object-view` element — so it never passes through `ListView`,
 * and the strip this card landed in `plugin-list` does not reach it. Its own
 * `case 'calendar':` comment has said "the SECOND route to `ObjectCalendar`"
 * since objectui#7029; the same distinction the kanban branch records for
 * objectui#9242 one card over.
 *
 * ## ⭐ WHY THIS FILE IS PART OF THE RETIREMENT AND NOT A FOLLOW-UP
 *
 * The retirement removed `ObjectCalendar`'s alias ladder. On THIS route the
 * producer kept spreading `...(viewOptions.calendar || {})` raw, so a document
 * that drew at the merge-base stopped drawing at head — the exact shape the
 * ruling calls not-ruled ("removed the ladder while the producer kept spreading
 * the alias, so documents failed silently"). A follow-up card cannot un-ship
 * that; the regression and its remedy belong to the same delivery.
 *
 * ## MEASURED BEFORE ANY MECHANISM WAS CHOSEN
 *
 * This file was written and run against the UNMODIFIED head (`c82937e3b`),
 * which is the strongest form of the reverse-verification leg: the "before" arm
 * is the real tree rather than an injected mutation, so there is no on-disk
 * mutation to prove and no restore leg to get wrong (the objectui#9242 idiom,
 * one card over, for the same reason). Predicted, then observed, on `c82937e3b`:
 *
 *   - half 1 (the emitted node) RED — the node carries a flat `dateField` /
 *     `endField` and no `startDateField`;
 *   - half 2 (the read door) RED — `safeValidateSchema` ACCEPTS the document;
 *   - every CONTROL green.
 *
 * ⚠️ AND ONE PREMISE DIED ON CONTACT. The read-door gap is NOT this PR's doing
 * and is NOT specific to the calendar: measured in the same pass, a named view
 * carrying the objectui#8365 stray `kanban.groupBy` is ACCEPTED here too, while
 * the identical key on a `list-view` document is refused. `ObjectViewSchema`'s
 * `listViews` is unmirrored by ruling and rides `.passthrough()`, so NOTHING
 * that lands on a view-kind block reaches a named view. ⇒ what this card
 * regressed on this route is the BEHAVIOUR (drew → mute); the silence at the
 * door was already there, for every alias refusal this module carries.
 *
 * ## THE REFUSAL'S SHAPE HERE, and why it is not a mirror
 *
 * `listViews` STAYS UNMIRRORED. The ruling that keeps it so (recorded on
 * `ObjectViewSchema` in `@object-ui/types`) turns on its VALUE TYPE — neither
 * the spec's strict `ObjectListViewSchema` nor the local `NamedListView` can be
 * the declared value without losing documented behaviour or enforcing 43 unread
 * members, so the key waits for the maintainer to decide that type, and ⛔ not
 * `z.any()`. A `.check()` on the `object-view` object decides none of that: it
 * declares no value, puts no key in `.shape`, enforces none of the 43, and
 * judges exactly the two spellings this card retires. The in-module precedent
 * is `ListViewSchema.options`, an untyped bag whose own `.check()` refuses
 * `kanban.groupBy` and this card's two calendar spellings by name.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { safeValidateSchema } from '@object-ui/types/zod';
import { ObjectView } from '../ObjectView';
import type { ObjectViewSchema } from '@object-ui/types';

/** Every schema the view hands to SchemaRenderer, in order. */
const rendered: any[] = [];

vi.mock('@object-ui/react', async (importOriginal) => {
  const ReactMod = await import('react');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    SchemaRenderer: ({ schema }: any) => {
      rendered.push(schema);
      return <div data-testid="schema-renderer">{schema?.type}</div>;
    },
    SchemaRendererContext: ReactMod.createContext(null),
    subscribeDataChanges: () => () => {},
    notifyDataChanged: () => {},
  };
});
vi.mock('@object-ui/plugin-grid', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectGrid: () => <div data-testid="object-grid" />,
}));
vi.mock('@object-ui/plugin-form', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectForm: () => <div data-testid="object-form" />,
}));

const dataSource = (): any => ({
  find: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getObjectSchema: vi.fn().mockResolvedValue({
    name: 'task',
    fields: {
      name: { name: 'name', type: 'text', label: 'Name' },
      kickoff: { name: 'kickoff', type: 'date', label: 'Kickoff' },
      wrapup: { name: 'wrapup', type: 'date', label: 'Wrapup' },
    },
  }),
});

/**
 * Renders a named calendar view through the REGISTERED renderer's path — i.e.
 * with no `renderListView` — and returns the `object-calendar` node the branch
 * emits.
 *
 * ⚠️ `cleanup()` is load-bearing, not hygiene: without it the previously
 * mounted views keep pushing into `rendered`, so the last entry is a STALE node
 * and every reading comes back shifted by one fixture. Recorded as a real
 * failure on objectui#9242, next door.
 */
async function generatedCalendarNode(entry: Record<string, unknown>): Promise<any> {
  cleanup();
  rendered.length = 0;
  render(
    <ObjectView
      schema={objectViewDoc(entry) as unknown as ObjectViewSchema}
      dataSource={dataSource()}
    />,
  );
  await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
  const node = rendered[rendered.length - 1];
  expect(node.type).toBe('object-calendar');
  return node;
}

/**
 * The authored document shape, as `listViews` carries it on an object-view node
 * — and the ONE fixture BOTH halves read, so the node arm and the read-door arm
 * cannot drift onto different documents (the objectui#8365 idiom).
 *
 * ⚠️ Driven through `schema.listViews`, ⛔ never through the `views` PROP.
 * `viewOptions` is built from `currentNamedViewConfig`, which is resolved from
 * `schema.listViews` alone; the `views` prop only reaches `activeView`, whose
 * legacy limb is the whole view OBJECT rather than its `options` bag. Measured
 * while writing this file: a first cut used the prop, and the `options.calendar`
 * row passed VACUOUSLY because `viewOptions.calendar` was undefined — a green
 * that asserted nothing about the nesting it names.
 */
const objectViewDoc = (entry: Record<string, unknown>) => ({
  type: 'object-view',
  objectName: 'task',
  listViews: { v1: { type: 'calendar', ...entry } },
});

const issuesEndingIn = (doc: unknown, suffix: string) => {
  const result = safeValidateSchema(doc);
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path.join('.').endsWith(suffix));
};

beforeEach(() => {
  rendered.length = 0;
});

describe('objectui#8355 · second route, half 1 — the emitted node carries canonical keys only', () => {
  it('neither retired spelling reaches the `object-calendar` node', async () => {
    const node = await generatedCalendarNode({ calendar: { dateField: 'kickoff', endField: 'wrapup', titleField: 'name' } });
    expect(Object.keys(node)).not.toContain('dateField');
    expect(Object.keys(node)).not.toContain('endField');
  });

  it('…and no canonical binding is invented from them', async () => {
    // ⛔ The arm that tells the ruling apart from option A. A producer-side fold
    // would emit `startDateField: 'kickoff'` and every other row here would
    // still pass. The ruling refused that end state on the first route; this
    // route follows it rather than forking.
    const node = await generatedCalendarNode({ calendar: { dateField: 'kickoff', endField: 'wrapup', titleField: 'name' } });
    expect(node.startDateField).toBeUndefined();
    expect(node.endDateField).toBeUndefined();
  });

  it('CONTROL: the canonical block still reaches the node intact', async () => {
    // Without this row, "the aliases do not reach the node" is satisfied by a
    // branch that forwards nothing at all.
    const node = await generatedCalendarNode({ calendar: { startDateField: 'kickoff', endDateField: 'wrapup', titleField: 'name' } });
    expect(node.startDateField).toBe('kickoff');
    expect(node.endDateField).toBe('wrapup');
    expect(node.titleField).toBe('name');
  });

  it('CONTROL: an unrelated renderer-ahead knob still rides the block through', async () => {
    // The branch strips exactly TWO keys; it did not become a whitelist.
    const node = await generatedCalendarNode({ calendar: { startDateField: 'kickoff', allDayField: 'is_all_day' } });
    expect(node.allDayField).toBe('is_all_day');
  });

  it('CONTROL: the LEGACY `options.calendar` nesting is stripped on the same path', async () => {
    // `viewOptions` merges the canonical block over the legacy `options` bag,
    // and the file's own note says that bag "is where the legacy field aliases
    // … `dateField` live" — so it is the nesting stored views actually carry.
    const node = await generatedCalendarNode({ options: { calendar: { dateField: 'kickoff', titleField: 'name' } } });
    expect(Object.keys(node)).not.toContain('dateField');
    expect(node.startDateField).toBeUndefined();
  });
});

describe('objectui#8355 · second route, half 2 — the document is REFUSED at the read door', () => {
  it('a named view authoring `calendar.dateField` is refused BY NAME, pointing at `startDateField`', () => {
    const issues = issuesEndingIn(objectViewDoc({ calendar: { dateField: 'kickoff' } }), 'calendar.dateField');
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('custom');
    expect(issues[0].message).toContain('Did you mean `dateField` → `startDateField`?');
  });

  it('…and `endField` in the same pass, pointing at `endDateField`', () => {
    const issues = issuesEndingIn(objectViewDoc({ calendar: { endField: 'wrapup' } }), 'calendar.endField');
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Did you mean `endField` → `endDateField`?');
  });

  it('the LEGACY `options.calendar` nesting is refused too, with the same message', () => {
    const issues = issuesEndingIn(objectViewDoc({ options: { calendar: { dateField: 'kickoff' } } }), 'options.calendar.dateField');
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Did you mean `dateField` → `startDateField`?');
  });

  it('DARK CONTROL: the canonical named view parses GREEN through the same door', () => {
    const r = safeValidateSchema(objectViewDoc({ calendar: { startDateField: 'kickoff', endDateField: 'wrapup' } }));
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true);
  });

  it('SCOPE CONTROL: `listViews` is still UNMIRRORED — nothing else about a named view is judged', () => {
    // ⭐ THE ARM THAT PROVES THIS IS NOT A MIRROR. The unmirrored ruling waits
    // on the key's VALUE TYPE; a check that declared one would refuse an
    // undeclared member, require `columns`, or reject the legacy `options` bag.
    // None of that happens: only the two retired spellings are judged.
    const undeclared = safeValidateSchema(objectViewDoc({ calendar: { zzqxNoSuchField: 'x' } }));
    expect(undeclared.success, 'an undeclared key inside a named view is now refused — that is a mirror, not a check').toBe(true);
    const noColumns = safeValidateSchema(objectViewDoc({ calendar: { startDateField: 'kickoff' } }));
    expect(noColumns.success, 'a named view without `columns` is now refused — the spec value type leaked in').toBe(true);
    const legacyBag = safeValidateSchema(objectViewDoc({ options: { calendar: { startDateField: 'kickoff' } } }));
    expect(legacyBag.success, 'the legacy `options` bag is now refused — documented behaviour was lost').toBe(true);
  });

  it('SCOPE CONTROL: the TIMELINE alias is untouched on this route too', () => {
    const r = safeValidateSchema({
      type: 'object-view',
      objectName: 'task',
      listViews: { v1: { type: 'timeline', timeline: { dateField: 'kickoff' } } },
    });
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true);
  });
});
