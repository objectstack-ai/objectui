/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8651 — `ObjectCalendar` is typed at the PUBLISHED schema of the
 * element it is registered as, and every key it reads off the node is declared
 * there.
 *
 * ## What was measured, and why the card's three-way split collapsed to two
 *
 * The card filed twelve keys in two classes — four undeclared on both arms of
 * `ObjectGridSchema | CalendarSchema`, eight declared on exactly ONE arm — and
 * asked, as its FIRST question, whether that union is right at all. Measured
 * with the TypeScript checker on the current tree (`getPropertyOfType`, never a
 * grep — objectui#8410), the answer decides eleven of the twelve at once:
 *
 *   `ObjectCalendarSchema` — this repo's published interface for the
 *   `object-calendar` element, and its zod mirror — ALREADY declares eleven of
 *   the fifteen keys this renderer reads, `allDayField`, `startDateField`,
 *   `endDateField`, `titleField`, `colorField` and `defaultView` among them
 *   (objectui#8466, #8174, #8314, #9239). Neither arm of the union it was
 *   actually annotated with is that interface.
 *
 * ⇒ the reads were never undeclared for want of a declaration; they were
 * undeclared because the props type pointed somewhere else. Both arms go:
 *
 *   - `ObjectGridSchema` is `type: 'object-grid'`. Nothing hands this component
 *     one — the single production call site is this package's own
 *     `index.tsx`, and both of its registrations (`object-calendar` and
 *     `calendar`) publish `OBJECT_CALENDAR_INPUTS`, the `object-calendar`
 *     surface.
 *   - `CalendarSchema` was declared LOCALLY in `ObjectCalendar.tsx`, absent
 *     from this package's barrel — so no importer could ever name it — and it
 *     SHADOWED `@object-ui/types`' own published `CalendarSchema`, which is the
 *     date-picker primitive (`form.ts`, reachable at `ui:calendar` only,
 *     objectui#8499). Two layers, one word.
 *
 * The shape this leaves is the one every sibling widget in the family already
 * has: `ObjectKanban` takes `ObjectKanbanSchema`, `ObjectGantt` takes
 * `ObjectGanttSchema`, `ObjectMap` takes `ObjectMapSchema` — and `plugin-map`
 * is registered under TWO tags (`object-map` and `map`) with a single published
 * props type, exactly as this package is.
 *
 * ## The two keys that do NOT come along, and their separate exits
 *
 *   - `calendar` is declared by NO face of this repo, while
 *     `@objectstack/spec`'s `ComponentPropsMap['object-calendar']` declares it
 *     as the configuration container AND this package's registration `inputs`
 *     publishes it AND `getCalendarConfig` reads it FIRST. Triage's ruling for
 *     the family (objectui#8327, comment `5619610246`) makes that exit
 *     mechanical: declared in spec ⇒ align the mirror. Declared here.
 *   - `dateField` / `endField` were declared ONLY on the retired local
 *     interface and read only as fallback rungs beneath the canonical
 *     spellings. Nothing writes them: zero producers, zero fixtures, zero
 *     tests, zero docs — each census run below with a control that hits — and
 *     the spec refuses both BY NAME at the flat position and inside
 *     `CalendarConfigSchema`. ⇒ retired, per AGENTS.md #0.1: the remedy for a
 *     second spelling belongs at the producer, and there is no producer.
 *
 * ## ⛔ `navigation` is NOT ruled here, and its verdict is INVARIANT
 *
 * objectui#8652 carries the `navigation` family; the maintainer ruled B
 * (declare on the platform element schemas first, then mirror), the spec half
 * is objectstack#17987, and #8652 is `pm:blocked` on it. This card must not
 * rule, declare, retire or touch it.
 *
 * ⭐ It does not, and that is measurable rather than asserted: through the
 * UNION the key was already undeclared (`ObjectGridSchema` declares it,
 * `CalendarSchema` does not, and a union member is declared only when EVERY arm
 * declares it), and on `ObjectCalendarSchema` it is undeclared too. Same
 * verdict at the read site before and after; the read itself is untouched. It
 * is ledgered BY NAME below, with an assertion that it is STILL READ — a stale
 * exception is a hole (the objectui#8885 ledger discipline).
 *
 * ## What the population assertion is, and why it is not a written-down list
 *
 * AGENTS.md #9: a claim that needs a live population is defended by an
 * instrument that re-derives it every run, never by a figure in prose. So the
 * central row below takes BOTH sides from the tree at run time — the keys read
 * come from a cast-aware census over `ObjectCalendar.tsx` (objectui#6576's
 * `schemaReads`, comment-masked so a retired spelling surviving in prose cannot
 * move a verdict), and the keys declared come from the zod mirror's own
 * `.shape`, never from parse acceptance, which under `.passthrough()` cannot
 * tell "declared" from "admitted unexamined" (objectui#8466's instrument).
 *
 * The TS face is held to the same set by the standing `zod-mirror-parity`
 * ratchet plus the compile-time pins in this file, so one row covers both
 * published faces without this file re-implementing a second checker.
 *
 * ## The ceiling, stated rather than assumed (objectui#5155 / #7927)
 *
 * `BaseSchema` ends in `[key: string]: any` and its mirror is `.passthrough()`,
 * so declaring a key buys VALUE validation and never buys rejection of a
 * MISSPELLING. The counter-probe below pins that honestly, so nobody reads this
 * file as claiming more than it does.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ComponentPropsMap } from '@objectstack/spec/ui';
import { ObjectCalendarSchema as ObjectCalendarMirror } from '@object-ui/types/zod';
import type { ObjectCalendarSchema } from '@object-ui/types';

import { ObjectCalendar, type ObjectCalendarComponentProps } from '../ObjectCalendar';

// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const CALENDAR_READER = 'packages/plugin-calendar/src/ObjectCalendar.tsx';

/**
 * The ONE key this card deliberately does not rule on — objectui#8652's remit,
 * maintainer-ruled B and blocked on objectstack#17987. Every entry must still
 * be READ; see the header for why the ledger asserts that and nothing else.
 */
const LEDGERED_OTHER_CARD_READS = ['navigation'] as const;

/** The two spellings this card retires. */
const RETIRED_SPELLINGS = ['dateField', 'endField'] as const;

/** Their canonical twins — the control that makes a zero above a reading. */
const CANONICAL_TWINS = ['startDateField', 'endDateField'] as const;

/** A key nothing reads and nothing declares: the both-ways control. */
const CONTROL_KEY = 'zzqxNoSuchField';

/* ── Instruments ──────────────────────────────────────────────────────────── */

function readRepo(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf8');
}

/**
 * Every key read off the schema node, in EITHER form: the bare `schema.KEY` and
 * the cast `(schema as any).KEY`. Both spell the same FACT — the renderer reads
 * this key — and only one spells it through a cast that this card's cleanup
 * deletes. Reading the fact rather than the spelling is what stops these
 * verdicts reddening on that cleanup (objectui#8832). Borrowed verbatim from
 * `types/src/__tests__/calendar-flat-color-allday-8466.test.ts`.
 */
const SCHEMA_READ = /(?:\bschema\b|\(\s*schema\s+as\s+[^)]*\))\s*\.\s*([A-Za-z_$][\w$]*)/g;

function schemaReads(source: string): Set<string> {
  return new Set([...source.matchAll(SCHEMA_READ)].map((m) => m[1]));
}

/** The renderer's reads, with prose masked so a retired spelling in a comment cannot vote. */
function rendererReads(): Set<string> {
  return schemaReads(mask(readRepo(CALENDAR_READER)));
}

/** Declared membership, off the mirror's OWN shape — never off parse acceptance. */
function shapeKeys(schema: unknown): string[] {
  return Object.keys((schema as { shape: Record<string, unknown> }).shape);
}

/**
 * ⚠️ `ComponentPropsMap` entries are read through `Record<string, any>` on
 * purpose: `_def` is a zod INTERNAL for which the spec publishes no type, so a
 * hand-written shape for it would be a local assertion about a third-party
 * runtime that nothing re-checks. The same reading, and the same decision, as
 * `calendar-flat-color-allday-8466.test.ts`.
 */
function specShapeKeys(type: string): string[] {
  const entry = (ComponentPropsMap as unknown as Record<string, any>)[type];
  const def = entry._def;
  const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
  return Object.keys(shape);
}

/* ── Compile-time pins (compiled by `tsc -p tsconfig.test.json`) ───────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

/**
 * `Equal`, not `extends`: a union arm carrying `BaseSchema`'s index signature
 * makes an UNDECLARED member read `any`, and a one-way check accepts `any` on
 * both sides — which is precisely the before-state this card removes.
 */
export type assertionSchemaPropIsThePublishedElementSchema =
  Expect<Equal<ObjectCalendarComponentProps['schema'], ObjectCalendarSchema>>;
/** The helper can FAIL — synthetic control. */
export type assertionEqualCanFail = Expect<Equal<Equal<any, ObjectCalendarSchema>, false>>;

/* ── 1. The props type ────────────────────────────────────────────────────── */

describe('objectui#8651 — the props type is the published element schema', () => {
  it('accepts the flat calendar vocabulary contextually typed, with NO cast', () => {
    const schema: ObjectCalendarComponentProps['schema'] = {
      type: 'object-calendar',
      objectName: 'duly_task',
      startDateField: 'kickoff',
      endDateField: 'wrapup',
      titleField: 'nickname',
      colorField: 'status_colour',
      allDayField: 'is_all_day',
      defaultView: 'week',
    };
    expect(schema.startDateField).toBe('kickoff');
    expect(schema.defaultView).toBe('week');
  });

  it('accepts the nested `calendar` container the spec names, contextually typed', () => {
    const schema: ObjectCalendarComponentProps['schema'] = {
      type: 'object-calendar',
      objectName: 'duly_task',
      calendar: { startDateField: 'kickoff', endDateField: 'wrapup', titleField: 'nickname' },
    };
    expect(schema.calendar?.startDateField).toBe('kickoff');
  });
});

/* ── 2. The population: every read is declared, or ledgered by name ────────── */

describe('objectui#8651 — every key read off the node is declared on that schema', () => {
  it('no read is undeclared, with `navigation` ledgered by name', () => {
    const reads = rendererReads();
    const declared = new Set(shapeKeys(ObjectCalendarMirror));
    const undeclared = [...reads]
      .filter((key) => !declared.has(key))
      .filter((key) => !(LEDGERED_OTHER_CARD_READS as readonly string[]).includes(key))
      .sort();
    expect(undeclared, `undeclared reads on ObjectCalendarSchema: ${undeclared.join(', ')}`)
      .toEqual([]);
  });

  it('the ledger is not stale: every carve-out is STILL read', () => {
    const reads = rendererReads();
    for (const key of LEDGERED_OTHER_CARD_READS) {
      expect([...reads], `${key} is ledgered but no longer read — the exception is a hole`)
        .toContain(key);
    }
  });

  it('⛔ and `navigation` stays UNDECLARED here — objectui#8652 owns it, not this card', () => {
    expect(shapeKeys(ObjectCalendarMirror)).not.toContain('navigation');
  });

  it('CONTROL: both halves of the row above can fail', () => {
    // The census sees a read that is there…
    expect([...rendererReads()]).toContain('objectName');
    // …and does not invent one that is not.
    expect(rendererReads().has(CONTROL_KEY)).toBe(false);
    // The declared set is a real set, not everything.
    expect(shapeKeys(ObjectCalendarMirror)).toContain('startDateField');
    expect(shapeKeys(ObjectCalendarMirror)).not.toContain(CONTROL_KEY);
    // And the census fires on both spellings, so the cast cleanup cannot mute it.
    const probe = schemaReads('const a = schema.alphaKey; const b = (schema as any).betaKey;');
    expect([...probe].sort()).toEqual(['alphaKey', 'betaKey']);
  });
});

/* ── 3. `calendar`, the container the spec names ───────────────────────────── */

describe('objectui#8651 — `calendar` is declared, on the grounds the spec already set', () => {
  it('the spec declares it at the flat position (control: a nonsense key on the same call)', () => {
    expect(specShapeKeys('object-calendar')).toContain('calendar');
    const oc = (ComponentPropsMap as unknown as Record<string, any>)['object-calendar'];
    expect(oc.safeParse({ objectName: 'duly_task', calendar: { startDateField: 'kickoff' } }).success)
      .toBe(true);
    expect(oc.safeParse({ objectName: 'duly_task', [CONTROL_KEY]: 'x' }).success).toBe(false);
  });

  it('the mirror declares it — read off the shape, not off acceptance', () => {
    expect(shapeKeys(ObjectCalendarMirror)).toContain('calendar');
  });

  it('…and now VALUE-validates it, which is the whole of what declaring buys', () => {
    const node = { type: 'object-calendar', objectName: 'duly_task' };
    expect(ObjectCalendarMirror.safeParse({ ...node, calendar: 42 }).success).toBe(false);
    const ok = ObjectCalendarMirror.safeParse({
      ...node,
      calendar: { startDateField: 'kickoff', titleField: 'nickname', allDayField: 'is_all_day' },
    });
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
  });

  it('the objectui#7927 ceiling is UNCHANGED: a misspelling is still admitted', () => {
    const node = { type: 'object-calendar', objectName: 'duly_task' };
    expect(ObjectCalendarMirror.safeParse({ ...node, calender: { startDateField: 'k' } }).success)
      .toBe(true);
  });
});

/* ── 4. The retired spellings ──────────────────────────────────────────────── */

describe('objectui#8651 — the `dateField` / `endField` alias rungs are retired', () => {
  it('the renderer no longer reads either spelling', () => {
    const reads = rendererReads();
    for (const key of RETIRED_SPELLINGS) {
      expect([...reads], `${key} is still read off the node`).not.toContain(key);
    }
  });

  it('CONTROL: the same census DOES see the canonical twins, so the zero is a reading', () => {
    const reads = rendererReads();
    for (const key of CANONICAL_TWINS) expect([...reads]).toContain(key);
  });

  it('neither is declared on the mirror either', () => {
    const declared = shapeKeys(ObjectCalendarMirror);
    for (const key of RETIRED_SPELLINGS) expect(declared).not.toContain(key);
  });
});

/* ── 5. …and the retirement is observable on screen ───────────────────────── */

vi.mock('@object-ui/plugin-detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-detail')>()),
  RecordDetailPanel: () => null,
  deriveRecordPageHref: () => null,
}));

const OBJECT_SCHEMA = {
  name: 'duly_task',
  nameField: 'subject',
  fields: {
    id: { name: 'id', type: 'text' },
    subject: { name: 'subject', type: 'text' },
    nickname: { name: 'nickname', type: 'text' },
    kickoff: { name: 'kickoff', type: 'datetime' },
  },
};

const ROW = {
  id: 'r1',
  subject: 'Default display name',
  nickname: 'Authored event title',
  kickoff: '2026-03-01T09:00:00.000Z',
};

function makeDataSource() {
  return {
    find: vi.fn(async () => ({ data: [ROW], total: 1 })),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => OBJECT_SCHEMA),
  } as any;
}

const REFUSAL = /Calendar configuration required/i;

describe('objectui#8651 — the retirement reaches the screen', () => {
  it('a node configured ONLY through the retired spelling draws the refusal screen', async () => {
    render(
      <ObjectCalendar
        schema={{ type: 'object-calendar', objectName: 'duly_task', dateField: 'kickoff', titleField: 'nickname' } as any}
        dataSource={makeDataSource()}
      />,
    );
    await waitFor(() => expect(screen.getByText(REFUSAL)).toBeTruthy());
  });

  it('CONTROL: the canonical spelling on the same rows draws a calendar, not the refusal', async () => {
    render(
      <ObjectCalendar
        schema={{ type: 'object-calendar', objectName: 'duly_task', startDateField: 'kickoff', titleField: 'nickname' } as any}
        dataSource={makeDataSource()}
      />,
    );
    await waitFor(() => expect(screen.queryByText(REFUSAL)).toBeNull());
  });
});
