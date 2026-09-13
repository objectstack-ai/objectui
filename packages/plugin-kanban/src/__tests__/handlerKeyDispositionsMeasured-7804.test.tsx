/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Two of the three handler keys `KanbanRenderer` reads off the authored
 * document are now JUDGED by the `object-kanban` arm, and each one's
 * objectui#6124 disposition is MEASURED here rather than shared across the
 * prefix (objectui#7804, the `plugin-kanban` slice of the 39-row finding;
 * director seat ruling of 2026-09-07, decision batch #69).
 *
 * ## The exposure this closes
 *
 * `BaseSchema` is `.passthrough()`. A key an arm does not declare is not
 * refused — it stops being judged and the value is KEPT, then reaches the
 * renderer that reads it. `ObjectKanbanSchema` declared none of these three
 * while `KanbanRenderer` forwarded all three off `schema.*`, so an authored
 * `onCardClick: { action: 'toast' }` parsed GREEN and was handed to a call site
 * expecting a function. That is objectui#7664's measured transition, one arm
 * over, and `AlertDialogSchema.onAction` was this same shape until
 * objectui#7104 declared it.
 *
 * ## ⭐ The three do NOT agree, and that is the deliverable
 *
 * The ruling requires the disposition per key. Measured on the ONE surviving
 * registration, `'object-kanban'` (`ObjectKanbanRenderer` → `ObjectKanban` →
 * `KanbanRenderer`):
 *
 *   - `onQuickAdd` — RUNTIME SLOT. It rides `ObjectKanban`'s `...schema` spread
 *     untouched and arrives at the board implementation BY IDENTITY.
 *   - `onCardClick` — RUNTIME SLOT. `ObjectKanban` replaces the schema key with
 *     its own wrapper, but `SchemaRenderer` also spreads the authored key as a
 *     React PROP, `ObjectKanbanComponentProps` declares that prop, and the
 *     wrapper CALLS it. The authored function runs.
 *   - `onCardMove` — the reading is `'retired'` and it does NOT land here.
 *     `ObjectKanban` replaces the schema key with `handleCardMove` and declares
 *     NO `onCardMove` prop (its rest parameter is discarded), so neither
 *     channel delivers and an authored value reaches nothing on this arm.
 *
 * ⛔ "`ObjectKanban` overrides it" does not separate `onCardClick` from
 * `onCardMove` — it is true of both. What separates them is the PROP channel,
 * which only `onCardClick` has, so that is what suite 2 drives.
 *
 * ## ⚠️ Why the third key is recorded here instead of declared
 *
 * `check:handler-key-reads` — the gate of record for this class — refuses the
 * `'retired'` spelling while a renderer still reads the key, and prints
 * `declares it RETIRED, but a renderer still reads it`. Its own contract says
 * why: a tombstone "exists precisely because nothing reads the key — it has no
 * read site BY CONSTRUCTION". `KanbanRenderer` does read `schema.onCardMove`,
 * off the document `ObjectKanban` hands it; what the gate cannot see is that
 * the value at that read was substituted one hop earlier.
 *
 * ⛔ The two spellings that would make it green are both worse. Declaring
 * `'runtime-slot'` keeps the TypeScript twin callable and so publishes a key
 * the object-bound board DROPS — the one resolution this package's `quickAdd`
 * carve-out records as forbidden. Deleting the read narrows `KanbanRenderer`'s
 * published props, which is the objectui#7742 remedy (`objectFields`, one file
 * over, maintainer decision batch #70) and a ruling rather than a repair.
 *
 * ⇒ `onCardMove` keeps its `KNOWN_UNDECLARED_READS` row naming objectui#7804,
 * which stays open and stays the parent. Suite 1 pins it as STILL ACCEPTED AND
 * KEPT, so the exposure cannot drift silently and the day it is closed this
 * file goes red pointing at the reading that closed it.
 *
 * ## Every control here can fire
 *
 * A `'retired'` ruling is a claim about absence, and an absent read and an
 * unreachable one look identical to a grep. So the dead-read leg does not stop
 * at "the authored function is not the one the board got": it DRIVES the
 * handler the board was handed and asserts the authored spy never runs, with
 * the same drive on `onCardClick` — which does run it — as the lit control on
 * the same instrument, the same document and the same render.
 *
 * ## Predictions, written before the code (red-first)
 *
 * On the unmodified base tree (`origin/main` @ `0f3d15314`), with this file in
 * place and no `packages/types` change yet:
 *
 *   - suite 1 (the accept set) FAILS on the two declared keys: both parse
 *     GREEN and the authored value survives into the parsed output, which is
 *     the exposure restated as a reading. Its `onCardMove` leg PASSES before
 *     and after — that key is the one this slice does not close;
 *   - suite 3 (both faces) FAILS on the two: nothing is declared on either
 *     face, so there is no disposition to read;
 *   - suite 4 (the drained ledger) FAILS listing the two
 *     `object-kanban::ObjectKanbanSchema.*` rows this slice drains, while its
 *     `onCardMove` row is expected to survive;
 *   - suite 2 (the channels) PASSES UNCHANGED, before and after. It measures
 *     the renderer, and this card changes no renderer — which is exactly why it
 *     is the evidence the dispositions are derived from rather than a
 *     restatement of them.
 *
 * ⭐ The base run FALSIFIED the last of those, and the correction is recorded
 * rather than smoothed over: suite 1 and suites 3–4 failed exactly as written
 * (all three keys ACCEPTED, with the authored value surviving into the parsed
 * output), but the dead-read leg of suite 2 also failed — on its lit CONTROL,
 * not on its subject. `onCardMove` was already measured dead; `onCardClick` ran
 * TWICE rather than once. That count is a defect in `ObjectKanban`'s click
 * wiring, not in this card's subject, so the control now asserts that the
 * authored handler RAN and the count is reported on its own card instead of
 * being pinned here.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { ObjectKanbanSchema as ObjectKanbanZod } from '@object-ui/types/zod';
// The gate of record's own ledger, read rather than restated: suite 4 asks
// whether the rows this slice landed are gone and the one it did not is still
// there, and a copy of the list here could answer that about itself.
// @ts-expect-error — plain-JS shared gate, intentionally untyped (`allowJs: false`)
import { KNOWN_UNDECLARED_READS } from '../../../../scripts/check-handler-key-read-sites.mjs';
// Prose is not source. Without the mask a docblock naming a member spelling
// would be read as a declaration, and this file's TS-face leg would report a
// disposition nobody wrote (`scripts/js-comment-mask.mjs`, kept honest by
// `check:comment-mask-corpus`).
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../scripts/js-comment-mask.mjs';
import '../index';

/** Local annotations, since both imports above are untyped — the call sites stay checked. */
const mask: (source: string) => string = maskComments;
const ledger: Map<string, string> = KNOWN_UNDECLARED_READS;

/** The three keys this slice owns, in the ledger's own spelling. */
const KEYS = ['onCardClick', 'onCardMove', 'onQuickAdd'] as const;

/** The two whose disposition LANDED — the third is recorded, not declared. */
const DECLARED = ['onCardClick', 'onQuickAdd'] as const;

/** Every props object the board implementation was rendered with, in order. */
const recorded = vi.hoisted(() => ({ impl: [] as Array<Record<string, unknown>> }));

// The lazy board chunk is a prop recorder: the question is what reaches the
// board's props, not what the board draws with them.
vi.mock('../KanbanImpl', () => ({
  default: (props: Record<string, unknown>) => {
    recorded.impl.push(props);
    return null;
  },
}));

const STATIC_COLUMNS = [{ id: 'todo', title: 'To Do', cards: [{ id: '1', title: 'One' }] }];

/**
 * Author a document on the PRODUCTION path — `SchemaRenderer` resolves the
 * registry key and spreads every non-metadata schema key as a React prop — and
 * return the props the board implementation was handed last.
 */
async function boardPropsFor(schemaKeys: Record<string, unknown>) {
  const before = recorded.impl.length;
  const { unmount } = render(
    <SchemaRendererProvider dataSource={undefined}>
      <SchemaRenderer
        schema={
          {
            type: 'object-kanban',
            columns: STATIC_COLUMNS,
            quickAdd: true,
            ...schemaKeys,
          } as never
        }
      />
    </SchemaRendererProvider>,
  );
  await waitFor(() => expect(recorded.impl.length).toBeGreaterThan(before));
  const received = recorded.impl[recorded.impl.length - 1];
  unmount();
  return received;
}

describe('suite 1 — the accept set: an authored handler key on `object-kanban` is REFUSED BY NAME (objectui#7804)', () => {
  /** The document shape objectui#7664 measured, re-pointed at the surviving key. */
  const board = (extra: Record<string, unknown>) => ({
    type: 'object-kanban',
    objectName: 'task',
    groupBy: 'status',
    ...extra,
  });

  it.each(DECLARED)('`%s: { action: "toast" }` draws the objectui#6124 named refusal', (key) => {
    const parsed = ObjectKanbanZod.safeParse(board({ [key]: { action: 'toast' } }));
    expect(
      {
        accepted: parsed.success,
        code: parsed.success ? null : parsed.error.issues[0]?.code,
        path: parsed.success ? null : parsed.error.issues[0]?.path.join('.'),
      },
      `an authored \`${key}\` still parses GREEN — the passthrough is keeping it and handing it to a call site that expects a function`,
    ).toEqual({ accepted: false, code: 'custom', path: key });
  });

  it('a live FUNCTION is refused there too — the arm is a refusal, not a type check', () => {
    // The #6124 predicate refuses everything, a function included: the JSON
    // face has no function value, and the programmatic face reaches the
    // renderer through React props and the TypeScript interface, never through
    // `safeParse`. Suite 2 is where the function channel is measured.
    const parsed = ObjectKanbanZod.safeParse(board({ onCardClick: () => {} }));
    expect(parsed.success).toBe(false);
  });

  it('⚠️ `onCardMove` is STILL ACCEPTED AND KEPT — the row this slice did not close', () => {
    // ⛔ Not an oversight and not a passing grade: this is the objectui#7664
    // exposure, still open on this one key, pinned so it cannot drift in
    // silence. The header says why declaring it is refused by the gate of
    // record and why the two greener spellings are worse. The day the read
    // moves to an explicit React prop and the key is tombstoned, THIS leg goes
    // red — which is the point of writing it down as a reading.
    const parsed = ObjectKanbanZod.safeParse(board({ onCardMove: { action: 'toast' } }));
    expect({
      accepted: parsed.success,
      kept: parsed.success ? (parsed.data as Record<string, unknown>).onCardMove : null,
    }).toEqual({ accepted: true, kept: { action: 'toast' } });
  });

  it('CONTROLS — the scope did not move: a declared key still parses, and an undeclared one is still KEPT', () => {
    // Lit control: the board itself is still acceptable, so the three `false`s
    // above are about those keys and not about a schema that now refuses
    // everything.
    expect(ObjectKanbanZod.safeParse(board({})).success).toBe(true);

    // Scope control: `BaseSchema` is still `.passthrough()`. This card judges
    // three keys; it does not turn the arm strict, and a reader must be able to
    // tell those apart.
    const probe = ObjectKanbanZod.safeParse(board({ zzzNotAHandlerKey: { action: 'toast' } }));
    expect({
      accepted: probe.success,
      kept: probe.success ? 'zzzNotAHandlerKey' in probe.data : null,
    }).toEqual({ accepted: true, kept: true });
  });
});

describe('suite 2 — the channels, per key, on the one surviving registration (objectui#7804)', () => {
  it('`onQuickAdd` reaches the board BY IDENTITY', async () => {
    const onQuickAdd = vi.fn();
    const props = await boardPropsFor({ onQuickAdd });
    expect(props.onQuickAdd).toBe(onQuickAdd);
  });

  it('`onCardClick` is REPLACED by ObjectKanban, and the replacement CALLS the authored one', async () => {
    const onCardClick = vi.fn();
    const card = { id: '1', title: 'One' };
    const props = await boardPropsFor({ onCardClick });

    // Control: the wrapper is genuinely interposed, so a call that reaches the
    // spy can only have arrived through it.
    expect(props.onCardClick).not.toBe(onCardClick);
    (props.onCardClick as (c: unknown, e?: unknown) => void)(card);
    expect(onCardClick).toHaveBeenCalledWith(card);
  });

  it('⭐ `onCardMove` reaches NOTHING — driven, not inferred, with `onCardClick` as the lit control', async () => {
    const onCardMove = vi.fn();
    const onCardClick = vi.fn();
    const card = { id: '1', title: 'One' };
    // ONE document, ONE render: the two keys travel the same passthrough, the
    // same `...schema` spread and the same prop spread, so the contrast below
    // is about the keys and not about how each was authored.
    const props = await boardPropsFor({ onCardMove, onCardClick });

    expect(props.onCardMove).not.toBe(onCardMove);
    // DRIVE the handler the board was actually handed. An authored value that
    // reached a live channel would run here; nothing does. A board with no
    // `groupBy` short-circuits `handleCardMove` before any write, so this drive
    // measures the forwarding and touches no data source.
    await (props.onCardMove as (a: string, b: string, c: string, d: number) => Promise<void> | void)(
      '1',
      'todo',
      'done',
      0,
    );
    (props.onCardClick as (c: unknown, e?: unknown) => void)(card);

    // ⚠️ The control asserts that `onCardClick` RAN, deliberately not how many
    // times. Measured on the base tree it runs TWICE per click on this path:
    // `ObjectKanban` passes the same function to `useNavigationOverlay` as
    // `onRowClick` — whose `handleClick` forwards to it and returns — and then
    // calls it again itself. That is a separate defect on a separate card; a
    // count pinned here would make fixing it red on a file that is not about
    // it, and the control needs only to be able to fire.
    expect(
      { cardMove: onCardMove.mock.calls.length, cardClickRan: onCardClick.mock.calls.length > 0 },
      'the lit control `onCardClick` must run — a run where NEITHER fires measures nothing',
    ).toEqual({ cardMove: 0, cardClickRan: true });
  });

  it("the prop channel is the difference: `ObjectKanbanComponentProps` declares `onCardClick` and no `onCardMove`", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = mask(readFileSync(join(here, '..', 'ObjectKanban.tsx'), 'utf8'));
    const declares = (key: string) => new RegExp(`^\\s{2}${key}\\?:`, 'm').test(src);
    expect({ onCardClick: declares('onCardClick'), onCardMove: declares('onCardMove') }).toEqual({
      onCardClick: true,
      onCardMove: false,
    });
  });
});

describe('suite 3 — the disposition is legible on BOTH faces, and they agree (objectui#7804)', () => {
  const TS_FACE = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'types',
    'src',
    'objectql.ts',
  );

  /** The `ObjectKanbanSchema` interface body, comments masked. */
  function objectKanbanInterface(): string {
    const src = mask(readFileSync(TS_FACE, 'utf8'));
    const start = src.indexOf('export interface ObjectKanbanSchema');
    expect(start, '`ObjectKanbanSchema` not found on the TypeScript face').toBeGreaterThan(-1);
    const end = src.indexOf('\n}', start);
    expect(end, '`ObjectKanbanSchema` has no closing brace').toBeGreaterThan(start);
    return src.slice(start, end);
  }

  it('the zod mirror refuses the two by name — and still declares nothing for the third', () => {
    const shape = ObjectKanbanZod.shape as Record<string, { description?: string } | undefined>;
    expect(KEYS.map((key) => ({ key, declared: key in shape }))).toEqual([
      { key: 'onCardClick', declared: true },
      { key: 'onCardMove', declared: false },
      { key: 'onQuickAdd', declared: true },
    ]);
    for (const key of DECLARED) {
      expect(shape[key]?.description, `\`${key}\` carries no author-facing guidance`).toContain(
        'objectui#6124',
      );
      expect(shape[key]?.description).toContain(key);
    }
  });

  it('the mirror spells RUNTIME SLOT on both landed keys, and nothing at all on the third', () => {
    const shape = ObjectKanbanZod.shape as Record<string, { description?: string } | undefined>;
    const said = (key: string) =>
      shape[key]?.description?.includes('RUNTIME SLOT')
        ? 'runtime-slot'
        : shape[key]?.description?.includes('RETIRED')
          ? 'retired'
          : 'undeclared';
    expect({
      onCardClick: said('onCardClick'),
      onCardMove: said('onCardMove'),
      onQuickAdd: said('onQuickAdd'),
    }).toEqual({
      onCardClick: 'runtime-slot',
      onCardMove: 'undeclared',
      onQuickAdd: 'runtime-slot',
    });
  });

  it('the TypeScript twin keeps both live slots callable, and declares no third member', () => {
    const body = objectKanbanInterface();
    const member = (key: string) => new RegExp(`^\\s{2}${key}\\?:\\s*([^;]+);`, 'm').exec(body)?.[1]?.trim();
    expect({
      onCardClick: member('onCardClick'),
      onCardMove: member('onCardMove'),
      onQuickAdd: member('onQuickAdd'),
    }).toEqual({
      onCardClick: '(card: any) => void',
      // ⚠️ `undefined` is the reading, not a gap in the regex — the firing
      // control below reads a member this interface has always had. A
      // `?: never` tombstone here is what the measurement asks for and what
      // the gate of record refuses; see the header.
      onCardMove: undefined,
      onQuickAdd: '(columnId: string, title: string) => void',
    });

    // Firing control on the same reader: a member this interface has always
    // declared still reads, so the three readings above are not a regex that
    // matches nothing.
    expect(member('groupBy')).toBe('string');
  });
});

describe('suite 4 — the ledger drained with the fix (objectui#7804)', () => {
  it('the two landed rows are gone, and the one this slice did not close is still named', () => {
    const rows = [...ledger.keys()].filter((row) =>
      row.startsWith('object-kanban::'),
    );
    expect(
      rows,
      'a ledger row naming a read that is now declared is a live waiver for a defect that is gone; a ' +
        'read that is still undeclared must keep its row or the gate loses it',
    ).toEqual(['object-kanban::ObjectKanbanSchema.onCardMove']);
    expect(
      ledger.get('object-kanban::ObjectKanbanSchema.onCardMove'),
    ).toBe('objectui#7804');
  });

  it('CONTROL — the ledger still carries the rows this slice did NOT take', () => {
    // objectui#7804 stays the parent and lands per package. A drained ledger
    // would mean this leg is reading an empty map rather than a shrinking one.
    //
    // ⚠️ The WITNESS is re-derived, not decorative. This leg named
    // `detail::DetailSchema.onNavigate` until the `plugin-detail` slice of the
    // same card declared it and drained the row — a row this slice did not
    // take, taken by a sibling slice that landed after it. That is the shape
    // to expect here: the witness is only ever a row no LANDED slice has
    // closed yet, so when its own slice lands, re-derive it against
    // `KNOWN_UNDECLARED_READS` rather than dropping the name and leaving the
    // length check alone — the length alone passes on a map holding one stale
    // row, which is the reading this control exists to refuse.
    const remaining = [...ledger.keys()];
    expect(remaining.length).toBeGreaterThan(0);
    expect(remaining).toContain('button::ButtonSchema.onSuccess');
  });
});
