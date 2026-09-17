/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8355 — `dateField` and `endField` are DECLARED REFUSALS on every
 * calendar surface this package publishes, on both faces.
 *
 * Director seat, 2026-09-16, class-1 self-adjudication: "retire the aliases at
 * both faces, now", under the maintainer's 2026-08-27 ruling that a retired
 * alias retires immediately with no phased window. The renderer half (the
 * `CalendarAliasRungs` ladder) and the producer half (`ListView`'s calendar
 * branch) land in the same change; this file is the DECLARATION half.
 *
 * ## ⭐ WHY A TOMBSTONE RATHER THAN A DELETION — the whole of the ruling
 *
 * An earlier attempt removed the ladder alone. `BaseSchema` ends
 * `.passthrough()` and every calendar config block does too, so the alias was
 * not refused when the ladder went — it was KEPT, unexamined, and then ignored.
 * The document validated green and drew a generic "Calendar configuration
 * required" screen naming keys the author had not written. ⇒ a live authoring
 * path broke SILENTLY with every gate green (recorded on objectui#8651).
 *
 * The refusal is what converts that silence into a by-name rejection at the
 * authoring door — `os check` / `os validate` / the save gate all run
 * `safeValidateSchema`, which is where the author is standing. ⛔ Never land one
 * half without the other.
 *
 * ## THE FOUR SURFACES, and why none of them is optional
 *
 *   1. `ListViewSchema.calendar` — the view-level block an author writes. This
 *      is the live authoring path the failed attempt broke.
 *   2. `ListViewSchema.options.calendar` — the LEGACY nesting. `ListView` merges
 *      `{ ...options.calendar, ...calendar }` before it reads anything, and
 *      app-shell's `calendarViewOptions` forwards a view's declared block into
 *      it, so stored views carry the aliases here too. `options` is
 *      `z.record(z.string(), z.any())` and can declare no MEMBER, so this one is
 *      a CHECK (`custom`) carrying the declared arm's own message —
 *      two codes, ONE string. Covering only surface 1 is the half-measure the
 *      objectui#8365 precedent names and refuses.
 *   3. `ObjectCalendarSchema` — the FLAT node face, which is where the retired
 *      ladder actually read and what `ListView` used to flatten the block into.
 *   4. `ObjectCalendarSchema.calendar` — the element's own container.
 *
 * ## THE CONTROLS, and what each would catch
 *
 * - DARK CONTROL (the canonical spelling alone) parses GREEN on every surface.
 *   Without it, "the door refuses the fixture" is satisfied by a door that
 *   refuses everything.
 * - PASSTHROUGH CONTROL (an undeclared nonsense key) still parses GREEN. Every
 *   calendar block stays `.passthrough()` for renderer-ahead knobs
 *   (`allDayField` is the live one); this card declared exactly two named
 *   refusal arms and did not close any object. Without this arm a later
 *   `.strict()` would satisfy every other assertion here.
 * - CANONICAL-TARGET CONTROL — the message points at `startDateField` for
 *   `dateField` and at `endDateField` for `endField`. ⚠️ This is the arm that
 *   holds the line against the upstream divergence recorded at the declaration
 *   site, and ⛔ the divergence is NOT an alias table: an earlier cut of this
 *   comment said `@objectstack/spec` "answers `dateField`" out of one, and that
 *   was wrong about the protocol. Re-derived by RUNNING the installed pin
 *   (17.4.0): `CalendarConfigSchema`'s `strictObject` options carry `surface`
 *   and `history` only — no `aliases` entry, so upstream holds no opinion about
 *   either spelling — and the "Did you mean `dateField` -> `endDateField`?" an
 *   author sees is a fallback `findClosestMatches` LEVENSHTEIN suggestion,
 *   budgeted `max(2, floor(len/3))`: `endDateField` is 3 edits from `dateField`
 *   and inside its budget of 3, `startDateField` is 5 and outside it, and
 *   `endField`'s budget of 2 reaches nothing at all — which is exactly why the
 *   passthrough control above and `endField` both draw no hint. ⇒ a generic
 *   typo-distance suggester picked the wrong sibling; it declares nothing and
 *   contradicts nothing. The hazard is still real for an author who copies it,
 *   which is why this arm exists: if a later edit ever makes this package answer
 *   `endDateField` for `dateField`, it reddens rather than silently re-binding
 *   authors' axes from start to end.
 *
 * ⚠️ `@ts-expect-error` is an ASSERTION, not a suppression: if a later edit
 * makes the alias compile again, tsc reports the directive itself as unused
 * (TS2578) and this file goes RED. vitest ERASES those arms, so a green vitest
 * run says nothing whatsoever about them — the gate for that half is
 * `pnpm --filter @object-ui/types type-check`. ⛔ Do not "verify" them by
 * running vitest over this file.
 *
 * REVERSE VERIFICATION — direction predicted before running, then observed:
 * remove either arm from `CalendarConfig` and the matching runtime rows go RED
 * while every control stays GREEN, and the compile-time arms report TS2578.
 */

import { describe, it, expect } from 'vitest';
import { ListViewSchema, ObjectCalendarSchema, ObjectViewSchema, ObjectQLComponentSchema } from '../zod/objectql.zod';
import type { ListViewInferred } from '../zod/objectql.zod';
import type { ObjectCalendarSchema as TsObjectCalendarSchema } from '../objectql';

/** A key nothing declares and nothing reads: the passthrough control. */
const CONTROL_KEY = 'zzqxNoSuchField';

/** alias -> the canonical spelling its message must name. */
const RETIRED: ReadonlyArray<readonly [alias: string, canonical: string]> = [
  ['dateField', 'startDateField'],
  ['endField', 'endDateField'],
];

/* ── The TYPE face — checked by `tsc`, erased by vitest ───────────────────── */

/** COMPILE-TIME PIN: the view-level block refuses both spellings. */
const viewBlockRefusesBothByTsc: ListViewInferred = {
  type: 'list-view',
  objectName: 'duly_task',
  calendar: {
    startDateField: 'kickoff',
    endDateField: 'wrapup',
    // @ts-expect-error objectui#8355 — `dateField` is a declared refusal on the
    // calendar block; write `startDateField` (above). Removing the arm makes
    // this directive unused → TS2578.
    dateField: 'kickoff',
    // @ts-expect-error objectui#8355 — `endField` is a declared refusal; write
    // `endDateField` (above).
    endField: 'wrapup',
  },
};

/** POSITIVE CONTROL: the canonical block compiles, so the pin is not "calendar is unwritable". */
const canonicalBlockCompiles: ListViewInferred = {
  type: 'list-view',
  objectName: 'duly_task',
  calendar: { startDateField: 'kickoff', endDateField: 'wrapup', titleField: 'nickname' },
};

/** COMPILE-TIME PIN: the FLAT node face refuses both spellings too. */
const nodeRefusesBothByTsc: TsObjectCalendarSchema = {
  type: 'object-calendar',
  objectName: 'duly_task',
  startDateField: 'kickoff',
  // @ts-expect-error objectui#8355 — `dateField?: never` on the node face.
  dateField: 'kickoff',
  // @ts-expect-error objectui#8355 — `endField?: never` on the node face.
  endField: 'wrapup',
};

/** POSITIVE CONTROL: the canonical flat node compiles. */
const canonicalNodeCompiles: TsObjectCalendarSchema = {
  type: 'object-calendar',
  objectName: 'duly_task',
  startDateField: 'kickoff',
  endDateField: 'wrapup',
};

/* ── The RUNTIME face — this is what vitest actually gates ────────────────── */

const listView = (extra: Record<string, unknown>) =>
  ListViewSchema.safeParse({ type: 'list-view', objectName: 'duly_task', ...extra });

const calendarNode = (extra: Record<string, unknown>) =>
  ObjectCalendarSchema.safeParse({ type: 'object-calendar', objectName: 'duly_task', ...extra });

const issueAt = (result: ReturnType<typeof listView>, path: string) =>
  result.success ? undefined : result.error.issues.find((i) => i.path.join('.') === path);

describe('objectui#8355 · the compile-time fixtures above are real program inputs', () => {
  it('exists so the fixtures cannot be dropped as unused — `tsc` is their only gate', () => {
    expect(canonicalBlockCompiles.calendar?.startDateField).toBe('kickoff');
    expect(canonicalNodeCompiles.endDateField).toBe('wrapup');
    expect((viewBlockRefusesBothByTsc.calendar as Record<string, unknown>).dateField).toBe('kickoff');
    expect((nodeRefusesBothByTsc as Record<string, unknown>).endField).toBe('wrapup');
  });
});

describe('objectui#8355 · surface 1 — the view-level `calendar` block', () => {
  it.each(RETIRED)('refuses `%s` BY NAME, at its own path, naming `%s`', (alias, canonical) => {
    const result = listView({ calendar: { startDateField: 'kickoff', [alias]: 'kickoff' } });
    expect(result.success, `${alias} still parses green on the view-level block`).toBe(false);
    const issue = issueAt(result, `calendar.${alias}`);
    expect(issue?.code, `${alias} is not refused at its own path`).toBe('invalid_type');
    expect(issue?.message).toContain(`Unrecognized key(s) on this calendar configuration: \`${alias}\``);
    expect(issue?.message).toContain(`Did you mean \`${alias}\` → \`${canonical}\`?`);
  });

  it('DARK CONTROL: the canonical spellings alone parse GREEN through the same door', () => {
    const ok = listView({ calendar: { startDateField: 'kickoff', endDateField: 'wrapup', titleField: 'nickname' } });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });

  it('PASSTHROUGH CONTROL: an undeclared key still parses — the block was NOT closed', () => {
    const ok = listView({ calendar: { startDateField: 'kickoff', [CONTROL_KEY]: 'x' } });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });
});

describe('objectui#8355 · surface 2 — the legacy `options.calendar` nesting', () => {
  it.each(RETIRED)('refuses `%s` there too, with the SAME message and the `custom` code', (alias, canonical) => {
    const result = listView({ options: { calendar: { startDateField: 'kickoff', [alias]: 'kickoff' } } });
    expect(result.success, `${alias} still parses green under options.calendar`).toBe(false);
    const issue = issueAt(result, `options.calendar.${alias}`);
    // `options` is an open record and can declare no MEMBER, so the refusal is
    // a CHECK. Two codes, ONE message — that is the point of reading the arm's
    // own `.description` rather than re-spelling it.
    expect(issue?.code).toBe('custom');
    expect(issue?.message).toContain(`Did you mean \`${alias}\` → \`${canonical}\`?`);
  });

  it('DARK CONTROL: a canonical legacy block parses GREEN', () => {
    const ok = listView({ options: { calendar: { startDateField: 'kickoff' } } });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });

  it('SCOPE CONTROL: nothing else under `options.calendar` is judged here', () => {
    const ok = listView({ options: { calendar: { [CONTROL_KEY]: 'x' } } });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });

  it('SIBLING CONTROL: the objectui#8365 `options.kanban.groupBy` refusal still fires', () => {
    // The calendar check was added inside the same `.check()` that carries the
    // kanban one, so this row is what reports a refactor that dropped the
    // earlier card's refusal on the way past.
    const result = listView({ options: { kanban: { groupBy: 'stage' } } });
    expect(result.success).toBe(false);
    expect(issueAt(result, 'options.kanban.groupBy')?.message)
      .toContain('Did you mean `groupBy` → `groupByField`?');
  });
});

describe('objectui#8355 · surfaces 3 and 4 — the `object-calendar` node', () => {
  it.each(RETIRED)('refuses a FLAT `%s` on the node, naming `%s`', (alias, canonical) => {
    const result = calendarNode({ startDateField: 'kickoff', [alias]: 'kickoff' });
    expect(result.success, `a flat ${alias} still parses green on the node`).toBe(false);
    const issue = result.success
      ? undefined
      : result.error.issues.find((i) => i.path.join('.') === alias);
    expect(issue?.code).toBe('invalid_type');
    expect(issue?.message).toContain(`Unrecognized key(s) on this object-calendar node: \`${alias}\``);
    expect(issue?.message).toContain(`Did you mean \`${alias}\` → \`${canonical}\`?`);
  });

  it.each(RETIRED)('refuses `%s` inside the element\'s own `calendar` container, naming `%s`', (alias, canonical) => {
    const result = calendarNode({ calendar: { startDateField: 'kickoff', [alias]: 'kickoff' } });
    expect(result.success, `calendar.${alias} still parses green on the node`).toBe(false);
    const issue = result.success
      ? undefined
      : result.error.issues.find((i) => i.path.join('.') === `calendar.${alias}`);
    expect(issue?.code).toBe('invalid_type');
    expect(issue?.message).toContain(`Did you mean \`${alias}\` → \`${canonical}\`?`);
  });

  it('DARK CONTROL: the canonical node parses GREEN on both nestings', () => {
    const flat = calendarNode({ startDateField: 'kickoff', endDateField: 'wrapup', titleField: 'nickname' });
    expect(flat.success, JSON.stringify(flat.error?.issues)).toBe(true);
    const nested = calendarNode({ calendar: { startDateField: 'kickoff', endDateField: 'wrapup' } });
    expect(nested.success, JSON.stringify(nested.error?.issues)).toBe(true);
  });

  it('PASSTHROUGH CONTROL: an undeclared flat key still rides `BaseSchema`', () => {
    const ok = calendarNode({ startDateField: 'kickoff', [CONTROL_KEY]: 'x' });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });

  it('⭐ the CONTAINER carries its OWN consequence clause, because the two surfaces fail differently', () => {
    // ⚠️ THE PER-SURFACE PIN. The flat face lands as a node BINDING, so a
    // retired `dateField` leaves the axis unbound and the renderer shows its
    // refusal screen. The element's own container is read WHOLE by
    // `getCalendarConfig`, so the config is never null, the refusal screen is
    // never reached, and the calendar mounts placing nothing. Both were
    // rendered and read; a shared clause published the first outcome on the
    // second surface for two rounds of this card.
    const flat = calendarNode({ dateField: 'kickoff' });
    const flatMsg = flat.success
      ? ''
      : flat.error.issues.find((i) => i.path.join('.') === 'dateField')?.message ?? '';
    expect(flatMsg).toContain('Calendar configuration required');
    expect(flatMsg).not.toContain('Unscheduled');

    const nested = calendarNode({ calendar: { dateField: 'kickoff' } });
    const nestedMsg = nested.success
      ? ''
      : nested.error.issues.find((i) => i.path.join('.') === 'calendar.dateField')?.message ?? '';
    expect(nestedMsg).toContain('Unscheduled');
    expect(nestedMsg).not.toContain('Calendar configuration required');

    // CONTROL: the two messages are otherwise the same string, so the split is
    // a tail and not two unrelated sentences that can drift apart.
    const stem = 'retired at both faces by objectui#8355';
    expect(flatMsg).toContain(stem);
    expect(nestedMsg).toContain(stem);
  });

  it('CONTROL: `endField` keeps ONE clause — it reads the same on both surfaces', () => {
    // Measured: on the container AND on the flat face, an `endField` beside a
    // start binding still DRAWS and only the event end is dropped. ⛔ Not
    // duplicated for symmetry; if that ever diverges, this row is where it shows.
    const flat = calendarNode({ startDateField: 'kickoff', endField: 'wrapup' });
    const nested = calendarNode({ calendar: { startDateField: 'kickoff', endField: 'wrapup' } });
    const msg = (r: typeof flat, path: string) =>
      r.success ? '' : r.error.issues.find((i) => i.path.join('.') === path)?.message ?? '';
    const tail = 'only the end of every event is silently dropped';
    expect(msg(flat, 'endField')).toContain(tail);
    expect(msg(nested, 'calendar.endField')).toContain(tail);
  });
});

describe('objectui#8355 · surface 5 — a NAMED VIEW, and the ledger it must not disturb', () => {
  it('⭐ `listViews` is STILL ABSENT from `ObjectViewSchema.shape` — the check is not a mirror', () => {
    // THE STRUCTURAL GUARD for the unmirrored ruling. That ruling waits on the
    // key's VALUE TYPE; the round-3 refusal is a `.check()` on the object, so it
    // declares nothing and the key never enters the shape. If a later edit turns
    // it into a member — of any type — this row reddens before the parity
    // ledger has to notice.
    const keys = Object.keys(ObjectViewSchema.shape);
    expect(keys).not.toContain('listViews');
    expect(keys, 'the shape is unreadable — the row above would pass vacuously').toContain('objectName');
  });

  it('the union still routes an `object-view`, and still refuses an unknown discriminator', () => {
    // `.check()` on a discriminated-union arm is the one structural risk the
    // round-3 mechanism carries, so it is asserted rather than assumed.
    expect(ObjectQLComponentSchema.safeParse({ type: 'object-view', objectName: 'duly_task' }).success).toBe(true);
    expect(ObjectQLComponentSchema.safeParse({ type: 'zzz-no-such-node' }).success).toBe(false);
  });

  it.each(RETIRED)('a named view authoring `calendar.%s` is refused through the union, naming `%s`', (alias, canonical) => {
    const r = ObjectQLComponentSchema.safeParse({
      type: 'object-view',
      objectName: 'duly_task',
      listViews: { v1: { type: 'calendar', calendar: { [alias]: 'kickoff' } } },
    });
    expect(r.success, `listViews.v1.calendar.${alias} still parses green`).toBe(false);
    const issue = r.success
      ? undefined
      : r.error.issues.find((i) => i.path.join('.') === `listViews.v1.calendar.${alias}`);
    expect(issue?.code).toBe('custom');
    expect(issue?.message).toContain(`Did you mean \`${alias}\` → \`${canonical}\`?`);
  });
});

describe('objectui#8355 · the TIMELINE alias is NOT this card, and stays live', () => {
  it('`timeline.dateField` still parses GREEN — the ruling retired the CALENDAR pair', () => {
    // ⛔ SCOPE ARM, not an omission. The card's own boundaries put the map /
    // gantt / timeline / kanban ladders on their own cards, and `timeline`'s
    // alias has live consumers this change does not touch: `normalizeListViewSchema`
    // folds it onto `startDateField`, `ObjectView` reads it, and app-shell pins
    // that it still renders. If a later sweep retires it, this row reddens and
    // whoever does it has to say so rather than carrying it in silently.
    const ok = listView({ timeline: { dateField: 'kickoff' } });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });
});
