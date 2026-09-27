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
 * - SIBLING CONTROL: the calendar check on the same door still fires, so an
 *   ablation of the kanban check reddens the kanban pins alone.
 *
 * ## ⭐ Inverted at objectui#7928, ⛔ no assertion deleted
 *
 * `listViews` is the protocol's strict `ObjectListViewSchema` record by
 * reference now (ruling A; director ruling on `options`, comment 5856694523).
 * So the protocol refuses the stray key itself (`unrecognized_keys` at
 * `listViews.KEY.kanban`), and this door adds the pointer beside that refusal.
 * The legacy `options.kanban` nesting is refused WHOLE (`options` by name) and
 * no longer judged inside. The scope controls that asserted "not a mirror" now
 * assert the mirror: an undeclared sibling, a block without `columns` and the
 * legacy bag are each refused by the record, and the door still adds no issue
 * of its own to any of them. Fixtures meant as canonical carry the protocol's
 * required `columns`.
 *
 * REVERSE VERIFICATION, direction predicted before running: unwire
 * `checkNamedViewKanbanStrayGroupBy` from `ObjectViewSchema` ⇒ every REFUSED arm
 * goes red (the document parses green), while the dark, scope and sibling
 * controls stay green. The run is recorded on the pull request, not kept as a
 * test.
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

/** A canonical kanban named view: the protocol's required `columns`, at both levels. */
const CANONICAL_KANBAN = { type: 'kanban', columns: ['name'], kanban: { groupByField: 'stage', columns: ['name'] } } as const;

const customIssues = (result: ReturnType<typeof safeValidateSchema>) => issuesOf(result).filter((i) => i.code === 'custom');

describe('objectui#10321 · a named view authoring the stray `kanban.groupBy` is REFUSED', () => {
  it('declared `kanban` block: refused by name at its own path, with the list-view route\'s string', () => {
    const view = { ...CANONICAL_KANBAN, kanban: { ...CANONICAL_KANBAN.kanban, groupBy: 'stage' } };
    const path = 'listViews.v1.kanban.groupBy';
    const result = safeValidateSchema(objectView({ v1: view }));
    expect(result.success, `${path} still parses green`).toBe(false);
    const issue = issueAt(result, path);
    expect(issue?.code).toBe('custom');
    expect(issue?.message).toBe(listViewRouteMessage());
    expect(issue?.message).toContain('Did you mean `groupBy` → `groupByField`?');
    // Was "one key written, one issue". Since objectui#7928 the protocol's own
    // refusal of the key sits beside this door's pointer: one key written, two
    // issues, the refusal at the block and the pointer at the key.
    expect(issuesOf(result), 'one key written: the protocol\'s refusal and this door\'s pointer').toHaveLength(2);
    const refusal = issueAt(result, 'listViews.v1.kanban') as (Issue & { keys?: string[] }) | undefined;
    expect(refusal?.code).toBe('unrecognized_keys');
    expect(refusal?.keys).toEqual(['groupBy']);
  });

  it('INVERTED — legacy `options.kanban` bag: refused WHOLE, `options` by name, and no longer judged inside (objectui#7928)', () => {
    // Was "refused by name at its own path, with the list-view route's string"
    // at `listViews.v1.options.kanban.groupBy`. The protocol refuses a named
    // view's `options` bag outright, and a stored body's bag is folded onto
    // `kanban` at `ViewPreview`, where the arm above judges it.
    const path = 'listViews.v1.options.kanban.groupBy';
    const result = safeValidateSchema(objectView({ v1: { ...CANONICAL_KANBAN, options: { kanban: { groupBy: 'stage' } } } }));
    expect(result.success, `${path} still parses green`).toBe(false);
    const issue = issueAt(result, path);
    expect(issue).toBeUndefined();
    expect(customIssues(result)).toEqual([]);
    const whole = issueAt(result, 'listViews.v1') as (Issue & { keys?: string[] }) | undefined;
    expect(whole?.code).toBe('unrecognized_keys');
    expect(whole?.keys).toEqual(['options']);
  });

  it('the key is judged in EVERY named view, and reported under that view\'s own key', () => {
    const result = safeValidateSchema(objectView({
      clean: CANONICAL_KANBAN,
      stray: { ...CANONICAL_KANBAN, kanban: { ...CANONICAL_KANBAN.kanban, groupBy: 'owner' } },
    }));
    expect(customIssues(result).map((i) => i.path.join('.'))).toEqual(['listViews.stray.kanban.groupBy']);
    // …and nothing at all is reported under the clean view.
    expect(issuesOf(result).filter((i) => i.path.join('.').startsWith('listViews.clean'))).toEqual([]);
  });
});

describe('objectui#10321 · the controls, each able to fire on its own', () => {
  it('DARK CONTROL: the canonical named view parses GREEN through the same door', () => {
    // `columns` at the top level too since objectui#7928: the protocol's named
    // view requires it.
    const result = safeValidateSchema(objectView({ v1: CANONICAL_KANBAN }));
    expect(result.success, JSON.stringify(issuesOf(result))).toBe(true);
  });

  it('INVERTED SCOPE CONTROL: an undeclared sibling in the kanban block is REFUSED by the record, and this door adds nothing (objectui#7928)', () => {
    // Was "accepted and KEPT". The protocol's kanban block declares
    // `columns` / `groupByField` / `summarizeField` only, and the named view is
    // that block by reference now. The door still judges `groupBy` alone.
    const result = safeValidateSchema(objectView({
      v1: { ...CANONICAL_KANBAN, kanban: { ...CANONICAL_KANBAN.kanban, swimlaneField: 'owner' } },
    }));
    expect(result.success, JSON.stringify(issuesOf(result))).toBe(false);
    const refusal = issueAt(result, 'listViews.v1.kanban') as (Issue & { keys?: string[] }) | undefined;
    expect(refusal?.code).toBe('unrecognized_keys');
    expect(refusal?.keys).toEqual(['swimlaneField']);
    expect(customIssues(result)).toEqual([]);
  });

  it('INVERTED SCOPE CONTROL: the spec value type IS the mirror — `columns` required, the legacy bag refused (objectui#7928)', () => {
    // Was "no spec value type leaked in": a door that adopted either would be a
    // mirror of `listViews`, and objectui#7928 made the mirror exactly that.
    const noColumns = safeValidateSchema(objectView({ v1: { type: 'kanban', kanban: { groupByField: 'stage' } } }));
    expect(noColumns.success, JSON.stringify(issuesOf(noColumns))).toBe(false);
    expect(issueAt(noColumns, 'listViews.v1.columns')).toBeDefined();
    expect(issueAt(noColumns, 'listViews.v1.kanban.columns')).toBeDefined();
    const legacyBag = safeValidateSchema(objectView({ v1: { ...CANONICAL_KANBAN, options: { kanban: { groupByField: 'stage' } } } }));
    expect(legacyBag.success, JSON.stringify(issuesOf(legacyBag))).toBe(false);
    expect((issueAt(legacyBag, 'listViews.v1') as (Issue & { keys?: string[] }) | undefined)?.keys).toEqual(['options']);
    // The door itself still adds no issue to either.
    expect(customIssues(noColumns)).toEqual([]);
    expect(customIssues(legacyBag)).toEqual([]);
  });

  it('SIBLING CONTROL: the calendar arm on the same door still refuses its retired spelling', () => {
    const result = safeValidateSchema(objectView({ v1: { type: 'calendar', calendar: { dateField: 'kickoff' } } }));
    const issue = issueAt(result, 'listViews.v1.calendar.dateField');
    expect(issue?.code).toBe('custom');
    expect(issue?.message).toContain('Did you mean `dateField` → `startDateField`?');
  });
});
