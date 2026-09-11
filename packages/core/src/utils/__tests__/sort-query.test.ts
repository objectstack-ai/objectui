/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `convertSortToQueryParams` — the shared sort→`$orderby` sink introduced with
 * objectstack#7137, when `object-timeline` and `record:line_items` gained sort
 * read sites and would otherwise have made a fifth and sixth private copy of the
 * conversion `ObjectGantt` / `ObjectMap` / `ObjectCalendar` each inline.
 *
 * Two of the cases below pin the two places this function is deliberately MORE
 * faithful to the declared contract than those copies: an entry with no `order`
 * is READ as ascending rather than dropped, and nothing usable yields
 * `undefined` rather than a truthy-but-empty `{}`.
 *
 * ⚠️ That first one is a RUNTIME tolerance, not an optional key. This header
 * used to call `SortConfig.order` "optional"; it is required on the interface,
 * on its zod mirror and on `@objectstack/spec`'s `SortItemSchema`. Corrected
 * under objectui#9031, whose subject is the third copy of that same sentence —
 * the one the refusal diagnostic printed at authors.
 *
 * The rest pin objectui#8221 (director ruling, decision batch #77, option B):
 * the legacy string clause is RETIRED, and — this is the load-bearing half —
 * it is refused OUT LOUD. Types are erased, so the narrowed signature stops a
 * string only at compile time; authored JSON and stored metadata rows still
 * reach this function carrying `"name desc"`. A silent `undefined` there is an
 * authored row order that quietly stops applying, which is precisely the
 * failure this repository keeps measuring. Every refusal below is therefore
 * paired with a well-formed control that still lowers: a sink that refused
 * everything would satisfy the refusal assertions on its own.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// The INSTALLED published artifact, not a local mirror of it — this is the judge
// a publish actually uses, and objectui#9031 is about the diagnostic disagreeing
// with it. No `resolve.alias` entry covers `@objectstack/*`, so this specifier
// resolves to `node_modules`, which is the whole point of reading it here.
import { SortItemSchema } from '@objectstack/spec/shared';
import { convertSortToQueryParams, normalizeSortEntries, resetRetiredSortSpellingReports } from '../sort-query';

/** The retired spelling, reached the only way it still can be: at runtime. */
const asRuntimeValue = (value: unknown) => value as unknown as Parameters<typeof convertSortToQueryParams>[0];

describe('convertSortToQueryParams', () => {
  it('lowers a SortConfig[] preserving key order', () => {
    expect(
      convertSortToQueryParams([
        { field: 'stage', order: 'asc' },
        { field: 'amount', order: 'desc' },
      ]),
    ).toEqual({ stage: 'asc', amount: 'desc' });
    expect(
      Object.keys(
        convertSortToQueryParams([
          { field: 'stage', order: 'asc' },
          { field: 'amount', order: 'desc' },
        ])!,
      ),
    ).toEqual(['stage', 'amount']);
  });

  it('treats an entry with no `order` as ascending instead of dropping it', () => {
    // `$orderby`'s own declared shape is `Array<{ field: string; order?: … }>`,
    // so an omitted direction means ascending. The three private copies this
    // function replaces require both keys and drop such an entry, losing an
    // authored sort key.
    expect(convertSortToQueryParams([{ field: 'line_no' }])).toEqual({ line_no: 'asc' });
    expect(
      convertSortToQueryParams([{ field: 'line_no' }, { field: 'amount', order: 'desc' }]),
    ).toEqual({ line_no: 'asc', amount: 'desc' });
  });

  it('returns undefined — never an empty object — when nothing is orderable', () => {
    expect(convertSortToQueryParams(undefined)).toBeUndefined();
    expect(convertSortToQueryParams(null)).toBeUndefined();
    expect(convertSortToQueryParams([])).toBeUndefined();
    // Entries with no usable field name contribute nothing, and an all-unusable
    // array must not produce a truthy `{}` that a caller would send as $orderby.
    expect(convertSortToQueryParams([{ order: 'desc' }])).toBeUndefined();
    expect(convertSortToQueryParams([{ field: '' }])).toBeUndefined();
    // Shapes the schema types do not declare are refused, not guessed at.
    expect(convertSortToQueryParams(asRuntimeValue(42))).toBeUndefined();
    expect(convertSortToQueryParams(asRuntimeValue({ name: 'desc' }))).toBeUndefined();
  });
});

describe('convertSortToQueryParams — the retired string clause (objectui#8221)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The reporter dedupes per spelling in module state, so without this the
    // second test to assert a diagnostic would observe silence and pass for
    // entirely the wrong reason.
    resetRetiredSortSpellingReports();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('REFUSES every string spelling the retired arm used to lower', () => {
    // The four readings the retired arm implemented, one per line. Each now
    // yields no ordering at all rather than the map it used to build.
    for (const spelling of ['name desc', 'name asc', 'name', 'name DESC']) {
      resetRetiredSortSpellingReports();
      expect(convertSortToQueryParams(asRuntimeValue(spelling))).toBeUndefined();
    }

    // CONTROL — the array arm still lowers on the same function, so the
    // assertions above are a refusal of the string and not a dead sink.
    expect(convertSortToQueryParams([{ field: 'name', order: 'desc' }])).toEqual({ name: 'desc' });
  });

  it('names the array form in the diagnostic — the refusal is legible, not silent', () => {
    expect(convertSortToQueryParams(asRuntimeValue('name desc'))).toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const message = String(errorSpy.mock.calls[0][0]);
    // The fix, not just the complaint: the message has to carry the spelling
    // the author must switch to, or it sends them looking for one.
    expect(message).toContain("[{ field: 'name', order: 'desc' }]");
    expect(message).toContain('retired');
    // It quotes what actually arrived, so the author can find it in their JSON.
    expect(message).toContain('"name desc"');
    // And it says the consequence out loud, because "refused" without "so your
    // rows are unordered" reads as a style note.
    expect(message).toContain('$orderby');
  });

  it('reports once per spelling — a render loop must not bury its own message', () => {
    convertSortToQueryParams(asRuntimeValue('name desc'));
    convertSortToQueryParams(asRuntimeValue('name desc'));
    convertSortToQueryParams(asRuntimeValue('name desc'));
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // CONTROL — a DIFFERENT retired spelling is a different authoring mistake
    // and still gets its own line, so the dedupe is per spelling and not a
    // one-message-ever latch.
    convertSortToQueryParams(asRuntimeValue('amount asc'));
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('stays silent for values that were never the retired spelling', () => {
    // An empty / absent `sort` is "the author asked for nothing", not "the
    // author used the retired clause" — reporting it would train readers to
    // ignore the message.
    expect(convertSortToQueryParams(asRuntimeValue(''))).toBeUndefined();
    expect(convertSortToQueryParams(undefined)).toBeUndefined();
    expect(convertSortToQueryParams(null)).toBeUndefined();
    // Nor for shapes that were never declared in either arm.
    expect(convertSortToQueryParams(asRuntimeValue(42))).toBeUndefined();
    expect(convertSortToQueryParams(asRuntimeValue({ name: 'desc' }))).toBeUndefined();
    // Nor for the arm that still works.
    expect(convertSortToQueryParams([{ field: 'name' }])).toEqual({ name: 'asc' });
    expect(errorSpy).not.toHaveBeenCalled();

    // CONTROL — the spy IS wired to this function: one retired spelling on the
    // same spy makes it fire, so the silence above is a reading and not a
    // disconnected mock.
    expect(convertSortToQueryParams(asRuntimeValue('   '))).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

/** Every `{ … }` entry the diagnostic quotes as the form the author must write. */
function entriesPrescribedBy(message: string): Array<Record<string, string>> {
  return (message.match(/\{[^{}]*\}/g) ?? []).map((literal) => {
    const entry: Record<string, string> = {};
    for (const [, key, value] of literal.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) entry[key] = value;
    return entry;
  });
}

/**
 * objectui#9031 — what the refusal PRESCRIBES has to survive a publish.
 *
 * This text is read at the moment the author is ALREADY being corrected. It used
 * to end "`order` is optional and means `'asc'`" — a RUNTIME tolerance stated as
 * an AUTHORING permission — so an author who followed the correction verbatim was
 * refused a second time, at publish, by a different door, with no hint that the
 * advice itself was wrong.
 *
 * The judge here is `SortItemSchema` from the INSTALLED `@objectstack/spec`, and
 * it is fed the message's OWN prescription, parsed back out of the emitted
 * string. Re-typing the example into the test would only pin the test's copy of
 * it; the way this regresses is somebody shortening the example the diagnostic
 * quotes, and only reading the real message catches that.
 *
 * Every leg runs against a live refusal produced in the same run. That control
 * is not bookkeeping: without it, "the wrong sentence is gone" is satisfied just
 * as well by a diagnostic that stopped firing.
 */
describe('the refusal prescribes metadata `@objectstack/spec` ACCEPTS (objectui#9031)', () => {
  /** Drive one real refusal and hand back exactly what it printed. */
  const captureRefusal = (spelling = 'name desc'): string => {
    resetRetiredSortSpellingReports();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(convertSortToQueryParams(asRuntimeValue(spelling))).toBeUndefined();
      // LIVE CONTROL — the diagnostic FIRED, on this spy, in this run.
      expect(spy).toHaveBeenCalledTimes(1);
      return String(spy.mock.calls[0][0]);
    } finally {
      spy.mockRestore();
    }
  };

  it('every entry it tells the author to write is ACCEPTED by the installed spec', () => {
    const prescribed = entriesPrescribedBy(captureRefusal());
    // Anti-vacuity: a message quoting no entry at all would otherwise pass.
    expect(prescribed.length).toBeGreaterThan(0);
    for (const entry of prescribed) {
      const verdict = SortItemSchema.safeParse(entry);
      expect(verdict.success, `prescribed entry rejected by SortItemSchema: ${JSON.stringify(entry)}`).toBe(true);
    }
  });

  it('CONTROL — the judge can say no, and names the key it is judging', () => {
    // `{ field: 'name' }` is precisely what "`order` is optional" told authors to
    // write. The SAME schema refuses it, so the ACCEPT above is a reading and not
    // a schema that says yes to whatever it is handed.
    const noOrder = SortItemSchema.safeParse({ field: 'name' });
    expect(noOrder.success).toBe(false);
    expect(noOrder.error?.issues[0]?.path).toEqual(['order']);

    // …and it names `field` when `field` is the missing one, so it judges keys
    // rather than refusing every object.
    const noField = SortItemSchema.safeParse({ order: 'desc' });
    expect(noField.success).toBe(false);
    expect(noField.error?.issues[0]?.path).toEqual(['field']);
  });

  it('states the tolerance as a tolerance, never as an authoring permission', () => {
    const message = captureRefusal();
    // The defect, spelled out. ("is not optional" does not contain this.)
    expect(message).not.toContain('is optional');
    expect(message).toMatch(/`order` is required/);
    expect(message).toContain('SortItemSchema');

    // …and the other truth still stands. "Delete the sentence" was rejected by
    // name: a missing `order` really is read as ascending here, and a message
    // that denies it sends the author hunting a key nothing ever dropped.
    expect(message).toContain("`'asc'`");
    expect(message).toMatch(/runtime tolerance/);
  });

  it('BEHAVIOUR — the rewording moved nothing: same inputs refused, same channel', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const spelling of ['name desc', 'name asc', 'name', 'name DESC']) {
        resetRetiredSortSpellingReports();
        expect(convertSortToQueryParams(asRuntimeValue(spelling))).toBeUndefined();
      }
      // Same severity channel: `console.error`, never `console.warn`. A rewording
      // that also downgraded the channel would pass every text assertion above.
      expect(errorSpy).toHaveBeenCalledTimes(4);
      expect(warnSpy).not.toHaveBeenCalled();

      // CONTROL — the arm that still works lowers unchanged, and silently, so
      // the four refusals are a refusal of the string and not a dead sink.
      expect(convertSortToQueryParams([{ field: 'name', order: 'desc' }])).toEqual({ name: 'desc' });
      expect(convertSortToQueryParams([{ field: 'name' }])).toEqual({ name: 'asc' });
      expect(errorSpy).toHaveBeenCalledTimes(4);
    } finally {
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});

/**
 * `normalizeSortEntries` — the decision `convertSortToQueryParams` was built
 * on, lifted out so a block that sends a DIFFERENT wire shape can share it
 * (objectui#8973).
 *
 * `object-grid` sends a `"field order"` join string, not this module's map, and
 * moving it onto the map is route B on objectui#8767 — declined by the
 * maintainer on 2026-09-10 pending its own card. It re-implemented the "which
 * entries survive, what does a missing `order` mean" decision privately and got
 * it wrong (`$orderby: 'name undefined'`). Exporting the decision without the
 * map is what lets the two agree without the shape moving.
 *
 * The second describe below is the load-bearing half: the map builder is now a
 * projection of this function, so every case must answer exactly what it
 * answered when it was a single loop. A refactor that quietly changed the map
 * would be a wire change in `object-calendar`, `object-gantt`, `object-map`,
 * `object-timeline` and `record:line_items` at once.
 */
describe('normalizeSortEntries (objectui#8973)', () => {
  it('fills a missing `order` with `asc` rather than dropping the key', () => {
    expect(normalizeSortEntries([{ field: 'name' }])).toEqual([{ field: 'name', order: 'asc' }]);
  });

  it('preserves authored order and keeps duplicates as separate entries', () => {
    // The map projection collapses these; the entry list deliberately does not,
    // because a join-string caller must be able to see what it was handed.
    expect(
      normalizeSortEntries([
        { field: 'stage', order: 'desc' },
        { field: 'stage', order: 'asc' },
      ]),
    ).toEqual([
      { field: 'stage', order: 'desc' },
      { field: 'stage', order: 'asc' },
    ]);
  });

  it('skips entries that name no usable field', () => {
    expect(normalizeSortEntries([{ order: 'desc' }, { field: '' }, { field: 'name' }])).toEqual([
      { field: 'name', order: 'asc' },
    ]);
  });

  it('normalizes a garbage direction to `asc` instead of forwarding it', () => {
    expect(normalizeSortEntries([{ field: 'name', order: 'DESCENDING' as never }])).toEqual([
      { field: 'name', order: 'asc' },
    ]);
  });

  it('answers `undefined`, never `[]`, so a caller can omit the query key', () => {
    expect(normalizeSortEntries([])).toBeUndefined();
    expect(normalizeSortEntries([{ order: 'desc' }])).toBeUndefined();
    expect(normalizeSortEntries(undefined)).toBeUndefined();
    expect(normalizeSortEntries(null)).toBeUndefined();
  });

  it('refuses a retired string clause with the SAME reporter, not a second one', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      resetRetiredSortSpellingReports();
      expect(normalizeSortEntries(asRuntimeValue('name desc'))).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(String(spy.mock.calls[0][0])).toContain('objectui#8221');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('convertSortToQueryParams — REGRESSION PIN: the refactor moved no behaviour', () => {
  /**
   * Expected values were captured from the PRE-REFACTOR implementation (the
   * single map-building loop) and are written out as LITERALS on purpose.
   * Deriving them from `normalizeSortEntries` would only prove the projection
   * is self-consistent — it would pass just as happily if both halves had moved
   * together, which is exactly the regression that matters: this map is the
   * `$orderby` of `object-calendar`, `object-gantt`, `object-map`,
   * `object-timeline` and `record:line_items`.
   */
  const CASES: Array<[string, unknown, Record<string, 'asc' | 'desc'> | undefined]> = [
    ['fully specified', [{ field: 'stage', order: 'asc' }, { field: 'amount', order: 'desc' }], { stage: 'asc', amount: 'desc' }],
    ['order omitted means asc', [{ field: 'name' }], { name: 'asc' }],
    ['field omitted is skipped', [{ order: 'desc' }], undefined],
    ['empty field is skipped', [{ field: '' }], undefined],
    ['duplicate field collapses last-wins', [{ field: 'stage', order: 'desc' }, { field: 'stage', order: 'asc' }], { stage: 'asc' }],
    ['empty array yields undefined', [], undefined],
    ['array of strings yields undefined', ['name desc'], undefined],
    ['null entry is skipped', [null], undefined],
    ['garbage direction normalizes to asc', [{ field: 'name', order: 'sideways' }], { name: 'asc' }],
    ['undefined', undefined, undefined],
    ['null', null, undefined],
    ['a number', 42, undefined],
    ['a bare unwrapped node', { field: 'name', order: 'desc' }, undefined],
  ];

  it.each(CASES)('%s', (_label, input, expected) => {
    const actual = convertSortToQueryParams(asRuntimeValue(input));
    expect(actual).toEqual(expected);
    // Key ORDER is part of this map's contract (the first test in this file
    // pins it), and `toEqual` does not compare it.
    expect(actual && Object.keys(actual)).toEqual(expected && Object.keys(expected));
  });

  it('CONTROL — the pin can fail: a deliberately wrong expectation is rejected', () => {
    expect(convertSortToQueryParams([{ field: 'name' }])).not.toEqual({ name: 'desc' });
  });
});
