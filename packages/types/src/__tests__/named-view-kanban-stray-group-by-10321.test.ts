/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10321 — a named view's stray `kanban.groupBy` is refused at the
 * object-view read door, with the string the `list-view` route already gives.
 *
 * The objectui#8365 ruling (B, maintainer 「8365 同意」) refuses a stored view's
 * `kanban.groupBy` loudly 「at the read door of the view, visible to the author
 * of the view」. PR objectui#9236 installed that refusal on the `list-view` route
 * only: the `KanbanConfig` arm (`kanban.groupBy`) and the legacy-bag check
 * (`options.kanban.groupBy`). A named view on an `object-view` document is the
 * second route (`generateViewSchema`, objectui#9242), and its `listViews` is
 * unmirrored, so `safeValidateSchema` ACCEPTED the key there in both nestings
 * and kept it. This file pins the door that closes that.
 *
 * ## What is asserted
 *
 * - REFUSED, both nestings, through the published door (`safeValidateSchema`,
 *   which `objectui validate` runs): the issue's `code` and `path`, and a
 *   message EQUAL to the one the `list-view` route gives. Equality, not a copy
 *   of the text: the ruling fixes the sentence shape, and the lead sentence is
 *   asserted only because the ruling names it.
 * - DARK CONTROL: the canonical named view parses green through the same door.
 * - SCOPE CONTROLS: the door is not a mirror of `listViews`. An undeclared
 *   sibling in the kanban block is kept, a kanban block without the spec's
 *   required `columns` is accepted, and so is the legacy `options.kanban` bag
 *   without the stray key.
 * - SIBLING CONTROL: the calendar arm on the same door still fires, so an
 *   ablation of the kanban row reddens the kanban pins alone.
 *
 * REVERSE VERIFICATION, direction predicted before running: remove the `kanban`
 * row from `NAMED_VIEW_ALIAS_REFUSALS` ⇒ every REFUSED arm goes red (the
 * document parses green), while the dark, scope and sibling controls stay green.
 * The run is recorded on the pull request, not kept as a test.
 */

import { describe, it, expect } from 'vitest';
import { safeValidateSchema } from '../zod/index.zod';
import { ListViewSchema } from '../zod/objectql.zod';

type Issue = { code: string; path: PropertyKey[]; message: string };

/** An `object-view` document whose named views are `listViews`. */
const objectView = (listViews: Record<string, unknown>) => ({
  type: 'object-view',
  objectName: 'deal',
  listViews,
});

const issuesOf = (result: ReturnType<typeof safeValidateSchema>): Issue[] =>
  result.success ? [] : (result.error.issues as Issue[]);

const issueAt = (result: ReturnType<typeof safeValidateSchema>, path: string): Issue | undefined =>
  issuesOf(result).find((i) => i.path.join('.') === path);

/** The message the `list-view` route answers the same key with. Read, not copied. */
function listViewRouteMessage(): string {
  const result = ListViewSchema.safeParse({
    type: 'list-view',
    objectName: 'deal',
    kanban: { groupByField: 'stage', groupBy: 'stage' },
  });
  const message = result.success
    ? ''
    : result.error.issues.find((i) => i.path.join('.') === 'kanban.groupBy')?.message ?? '';
  expect(message, 'the list-view route no longer refuses the key; there is no string to share').not.toBe('');
  return message;
}

const NESTINGS = [
  {
    name: 'declared `kanban` block',
    view: { type: 'kanban', kanban: { groupByField: 'stage', groupBy: 'stage' } },
    path: 'listViews.v1.kanban.groupBy',
  },
  {
    name: 'legacy `options.kanban` bag',
    view: { type: 'kanban', options: { kanban: { groupBy: 'stage' } } },
    path: 'listViews.v1.options.kanban.groupBy',
  },
] as const;

describe('objectui#10321 · a named view authoring the stray `kanban.groupBy` is REFUSED', () => {
  for (const nesting of NESTINGS) {
    it(`${nesting.name}: refused by name at its own path, with the list-view route's string`, () => {
      const result = safeValidateSchema(objectView({ v1: nesting.view }));
      expect(result.success, `${nesting.path} still parses green`).toBe(false);
      const issue = issueAt(result, nesting.path);
      expect(issue?.code).toBe('custom');
      expect(issue?.message).toBe(listViewRouteMessage());
      expect(issue?.message).toContain('Did you mean `groupBy` → `groupByField`?');
      expect(issuesOf(result), 'one key written, one issue').toHaveLength(1);
    });
  }

  it('the key is judged in EVERY named view, and reported under that view\'s own key', () => {
    const result = safeValidateSchema(objectView({
      clean: { type: 'kanban', kanban: { groupByField: 'stage' } },
      stray: { type: 'kanban', kanban: { groupByField: 'stage', groupBy: 'owner' } },
    }));
    expect(issuesOf(result).map((i) => i.path.join('.'))).toEqual(['listViews.stray.kanban.groupBy']);
  });
});

describe('objectui#10321 · the controls, each able to fire on its own', () => {
  it('DARK CONTROL: the canonical named view parses GREEN through the same door', () => {
    const result = safeValidateSchema(objectView({
      v1: { type: 'kanban', kanban: { groupByField: 'stage', columns: ['name'] } },
    }));
    expect(result.success, JSON.stringify(issuesOf(result))).toBe(true);
  });

  it('SCOPE CONTROL: an undeclared sibling in the kanban block is accepted and KEPT', () => {
    const result = safeValidateSchema(objectView({
      v1: { type: 'kanban', kanban: { groupByField: 'stage', swimlaneField: 'owner' } },
    }));
    expect(result.success, JSON.stringify(issuesOf(result))).toBe(true);
    const kept = result.success
      ? ((result.data as { listViews?: Record<string, { kanban?: Record<string, unknown> }> }).listViews?.v1?.kanban)
      : undefined;
    expect(kept).toEqual({ groupByField: 'stage', swimlaneField: 'owner' });
  });

  it('SCOPE CONTROL: no spec value type leaked in — no `columns` required, the legacy bag accepted', () => {
    // `@objectstack/spec`'s `KanbanConfigSchema` requires `columns` and its
    // `ObjectListViewSchema` refuses `options`; a door that adopted either would
    // be a mirror of `listViews`, which waits on objectui#7928.
    const noColumns = safeValidateSchema(objectView({ v1: { type: 'kanban', kanban: { groupByField: 'stage' } } }));
    expect(noColumns.success, JSON.stringify(issuesOf(noColumns))).toBe(true);
    const legacyBag = safeValidateSchema(objectView({ v1: { type: 'kanban', options: { kanban: { groupByField: 'stage' } } } }));
    expect(legacyBag.success, JSON.stringify(issuesOf(legacyBag))).toBe(true);
  });

  it('SIBLING CONTROL: the calendar arm on the same door still refuses its retired spelling', () => {
    const result = safeValidateSchema(objectView({ v1: { type: 'calendar', calendar: { dateField: 'kickoff' } } }));
    const issue = issueAt(result, 'listViews.v1.calendar.dateField');
    expect(issue?.code).toBe('custom');
    expect(issue?.message).toContain('Did you mean `dateField` → `startDateField`?');
  });
});
