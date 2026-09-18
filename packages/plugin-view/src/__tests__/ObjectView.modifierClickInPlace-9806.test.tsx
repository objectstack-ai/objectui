/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9806 — what a Cmd/Ctrl/middle-click on an `ObjectView` row actually
 * does, re-derived rather than described.
 *
 * ## The defect this file exists because of
 *
 * It is not a broken feature. It is a SENTENCE. PR objectui#9797 added a
 * comment to `ObjectView`'s `handleRowClick` closing with "what
 * Cmd/Ctrl/middle-click should do when no host handler is present is the hook's
 * own decision, taken before this callback runs" — and the hook never gets to
 * make that decision on this path. `useNavigationOverlay`'s `handleClick`
 * returns EARLY on the `onRowClick` it is handed, ahead of its own modifier
 * branch, and `ObjectView` hands `handleRowClick` down UNCONDITIONALLY. The
 * comment described a delegation that does not happen.
 *
 * A rewritten sentence with no instrument is the same defect deferred
 * (AGENTS.md #9), so this file is the instrument. The comment now cites it BY
 * NAME, and the last case below reads that citation back out of the file, so
 * the pin and the prose cannot drift apart in either direction.
 *
 * ## What is pinned, and why it takes a PAIR of clicks rather than one
 *
 * "A modifier click opens no new tab" is not, on its own, a reading about
 * modifiers: a probe that never delivered `metaKey` produces the same green.
 * Every case here therefore fires BOTH clicks at the same subject through the
 * same harness and compares them:
 *
 *  - SUBJECT (`ObjectView`, no host `onRowClick`): plain click and ⌘-click are
 *    INDISTINGUISHABLE. Both reach `onNavigate(id, 'view')` — navigation in
 *    place. That equivalence IS the corrected comment's claim.
 *  - LIVENESS CONTROL (`ObjectGrid`, no `onRowClick` at all): the two clicks
 *    DIVERGE — `'view'` and `'new_window'`. So the harness does deliver
 *    `metaKey`, and the hook's modifier branch is live and reachable. ⛔ Do not
 *    "simplify" it away: without it the subject's equivalence is unfalsifiable,
 *    and it is the only thing separating "an unconditional hop swallows the
 *    modifier" from "nothing in this test ever held down a key".
 *  - ISOLATION CONTROL: the SAME `ObjectGrid` call, plus one added prop — an
 *    unconditional `onRowClick`. The ⌘-click stops reaching `'new_window'` and
 *    arrives at the handler instead.
 *
 * ⚠️ The liveness control does NOT vary one thing against the subject, and
 * saying it did would be this card's own defect: it is a different composition
 * and it carries `onNavigate` on the grid node, which `ObjectView` never relays
 * into the grid schema it builds. It answers "is the probe alive", nothing
 * more. The ISOLATION control is the one-variable pair — same component, same
 * props, same spy, one prop added — and it is what attributes the subject's
 * equivalence to the early return rather than to the composition.
 *
 * ## ⚠️ The source-text case, and the hazard it is built against
 *
 * The third case asserts that `handleRowClick`'s branches do not READ the
 * modifier payload. Its subject is a file that DOCUMENTS the construct it
 * asserts on: `ObjectView.tsx` spells `event.metaKey` in the very comment this
 * card rewrote, so a naive absence check over the raw bytes would be red for a
 * prose reason, and a naive presence check would be green for one. Comments are
 * stripped, and the strip itself is controlled BOTH ways in the same run:
 * `event.metaKey` must be absent from the stripped file and present in the raw
 * one, so the absence is demonstrably the stripper's doing and not the token's.
 *
 * ⚠️ Stripping is necessary and NOT sufficient — a member DECLARATION survives
 * it. `useNavigationOverlay.ts` declares `metaKey?: boolean` on its payload
 * type and separately READS `event.metaKey`; a bare-identifier probe cannot
 * tell those apart, and a pin keyed on one would stay green over a hook that
 * had stopped reading modifiers entirely. The presence leg is therefore keyed
 * on the READ spelling, with the bare identifier's weaker answer pinned beside
 * it so the two can never be mistaken for equivalent.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ObjectGrid } from '@object-ui/plugin-grid';
import { ActionProvider, SchemaRendererProvider } from '@object-ui/react';
import type { DataSource } from '@object-ui/types';

import { ObjectView } from '../ObjectView';
import { installExplainDouble } from './explainDouble';

// `ObjectGrid` batches a record-grained write verdict for the rows on screen.
// With no host `apiFetch` it falls back to the global one, which under
// happy-dom is a REAL socket — the package's own double answers it so an
// escape to any OTHER endpoint stays observable.
beforeEach(() => {
  installExplainDouble();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const rows = [
  { id: 'r1', name: 'Alice', amount: 100 },
  { id: 'r2', name: 'Bob', amount: 200 },
];

const objectSchema = {
  name: 'test_object',
  label: 'Test object',
  fields: {
    id: { name: 'id', type: 'text', label: 'Id' },
    name: { name: 'name', type: 'text', label: 'Name' },
    amount: { name: 'amount', type: 'number', label: 'Amount' },
  },
};

function makeDataSource(): DataSource {
  return {
    // `{ data, total }`, which is the shape `ObjectGrid` reads (`result.data`).
    // A bare array resolves fine and renders ZERO rows — a silent empty grid,
    // not an error.
    find: vi.fn().mockResolvedValue({ data: rows, total: rows.length }),
    findOne: vi.fn().mockResolvedValue(rows[0]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    getObjectSchema: vi.fn().mockResolvedValue(objectSchema),
  } as unknown as DataSource;
}

/**
 * The one observable both halves share. `onNavigate` is the non-author function
 * slot every navigation destination on this path funnels through, and its
 * SECOND argument is the whole question: `'view'` is navigation in place,
 * `'new_window'` is the hook's modifier branch. Same spy, same shape, so the
 * subject and the control are literally the same assertion pointed at two
 * compositions.
 */
type NavigateSpy = Mock<(recordId: string | number, action: string) => void>;

function navigateActions(spy: NavigateSpy): string[] {
  return spy.mock.calls.map((call) => String(call[1]));
}

/** The row element a user clicks, in either composition. */
async function firstDataRow(container: HTMLElement): Promise<Element> {
  await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
  const row = container.querySelector('tbody tr');
  expect(
    row,
    'no data row rendered — the harness is broken, so nothing below is a reading about clicks',
  ).not.toBeNull();
  return row as Element;
}

/**
 * SUBJECT — the default content branch, which is where an authored
 * `object-view` with no host `renderListView` actually lands. No host
 * `onRowClick`: that is the exact condition the amended comment speaks about.
 * `layout: 'page'` plus `onNavigate` is what makes `handleView` observable
 * instead of opening an internal overlay.
 */
function renderView(onNavigate: NavigateSpy) {
  const dataSource = makeDataSource();
  return render(
    <ActionProvider>
      <SchemaRendererProvider dataSource={dataSource}>
        <ObjectView
          schema={{
            type: 'object-view',
            objectName: 'test_object',
            layout: 'page',
            onNavigate,
            table: { columns: ['name', 'amount'] },
          } as any}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>
    </ActionProvider>,
  );
}

/**
 * CONTROL rig — the same grid the subject renders underneath, reached directly.
 * `onRowClick` is the ONE prop the two control cases differ by, which is what
 * makes the pair an attribution rather than an observation. Inline data keeps
 * the controls independent of the subject's fetch path.
 */
function renderGrid(onNavigate: NavigateSpy, onRowClick?: (...args: any[]) => void) {
  return render(
    <ActionProvider>
      <ObjectGrid
        schema={{
          type: 'object-grid',
          objectName: 'test_object',
          columns: [
            { field: 'name', label: 'Name' },
            { field: 'amount', label: 'Amount', type: 'number' },
          ],
          data: { provider: 'value', items: rows },
          onNavigate,
        } as any}
        {...(onRowClick ? { onRowClick } : {})}
      />
    </ActionProvider>,
  );
}

describe('objectui#9806 — SUBJECT: an ObjectView row answers a modifier click exactly as it answers a plain one', () => {
  it('a plain click navigates in place', async () => {
    const onNavigate = vi.fn() as NavigateSpy;
    const { container } = renderView(onNavigate);

    fireEvent.click(await firstDataRow(container));

    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(navigateActions(onNavigate)).toEqual(['view']);
    expect(onNavigate.mock.calls[0][0]).toBe('r1');
  });

  it('a ⌘-click does the SAME thing — the hook\'s modifier branch is unreachable from here', async () => {
    const onNavigate = vi.fn() as NavigateSpy;
    const { container } = renderView(onNavigate);

    fireEvent.click(await firstDataRow(container), { metaKey: true });

    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(
      navigateActions(onNavigate),
      "a modifier click reached 'new_window' — `handleRowClick` or the hop feeding it now ACTS on the payload, so the comment on `handleRowClick` no longer describes this code and must be amended with this pin",
    ).toEqual(['view']);
    expect(onNavigate.mock.calls[0][0]).toBe('r1');
  });

  it('a Ctrl-click and a middle-click are the same again — all three spellings of the payload', async () => {
    for (const modifier of [{ ctrlKey: true }, { button: 1 }]) {
      const onNavigate = vi.fn() as NavigateSpy;
      const { container, unmount } = renderView(onNavigate);

      fireEvent.click(await firstDataRow(container), modifier);

      await waitFor(() => expect(onNavigate).toHaveBeenCalled());
      expect(navigateActions(onNavigate), JSON.stringify(modifier)).toEqual(['view']);
      unmount();
    }
  });
});

describe('objectui#9806 — LIVENESS CONTROL: with no onRowClick in the way, the same harness DOES reach the hook\'s modifier branch', () => {
  it('a plain click on a bare ObjectGrid navigates in place', async () => {
    const onNavigate = vi.fn() as NavigateSpy;
    const { container } = renderGrid(onNavigate);

    fireEvent.click(await firstDataRow(container));

    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(navigateActions(onNavigate)).toEqual(['view']);
  });

  it('a ⌘-click on the same grid DIVERGES — so the subject\'s equivalence is a reading, not a dead probe', async () => {
    const onNavigate = vi.fn() as NavigateSpy;
    const { container } = renderGrid(onNavigate);

    fireEvent.click(await firstDataRow(container), { metaKey: true });

    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(
      navigateActions(onNavigate),
      'the CONTROL is red — `metaKey` is not reaching the hook at all, so every SUBJECT case above measures nothing',
    ).toEqual(['new_window']);
  });
});

describe('objectui#9806 — ISOLATION CONTROL: adding ONE prop to that same grid is what swallows the modifier', () => {
  it('an unconditional onRowClick takes the ⌘-click away from the hook and receives the payload itself', async () => {
    const onNavigate = vi.fn() as NavigateSpy;
    // Unconditional, exactly as `ObjectView` hands `handleRowClick` down: the
    // handler does not consult the event before deciding to exist.
    const onRowClick = vi.fn();
    const { container } = renderGrid(onNavigate, onRowClick);

    fireEvent.click(await firstDataRow(container), { metaKey: true });

    await waitFor(() => expect(onRowClick).toHaveBeenCalled());
    expect(
      navigateActions(onNavigate),
      "the hook still reached 'new_window' despite an `onRowClick` being present — its early return is gone, and the comment on `handleRowClick` rests on that return",
    ).not.toContain('new_window');
    // The payload still ARRIVES — objectui#9462's repair is untouched. What the
    // handler does with it is the whole of objectui#9806.
    expect(onRowClick.mock.calls[0][1], 'the modifier payload stopped arriving — that is objectui#9462, not this card').toMatchObject({ metaKey: true });
  });
});

/* ------------------------------------------------------------------ *
 * SOURCE-TEXT half. Rooted on THIS FILE and never on `process.cwd()`,
 * which differs between the repo-root and package-level invocations.
 * ------------------------------------------------------------------ */

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/plugin-view/src/__tests__  ->  repo root.
const repoRoot = path.resolve(here, '../../../..');

const VIEW_SRC = 'packages/plugin-view/src/ObjectView.tsx';
const HOOK_SRC = 'packages/react/src/hooks/useNavigationOverlay.ts';

const readRaw = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

/**
 * Whole-line comments removed, nothing else. Same shape as the `readCode`
 * helper `scripts/__tests__/body-dialect-census.test.ts` uses for this exact
 * class of problem — an assertion whose subject is a file that talks ABOUT the
 * construct being asserted on.
 */
const readCode = (rel: string) =>
  readRaw(rel)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');

/**
 * `handleRowClick`'s own body — "the branches below" the comment names, and
 * nothing else in this 2000-line file. A missing anchor returns null so a
 * rename REDS here instead of quietly answering about the whole file.
 */
function handleRowClickBody(code: string): string | null {
  const open = code.indexOf('const handleRowClick = useCallback(');
  if (open < 0) return null;
  const close = code.indexOf('}, [onRowClick', open);
  if (close < 0) return null;
  return code.slice(open, close);
}

describe('objectui#9806 — the comment\'s claim about the CODE, with the stripper controlled both ways', () => {
  it('the stripper is live: `event.metaKey` is in this file raw, and gone once comments are stripped', () => {
    // BOTH directions, because either alone is worthless. Raw-present proves
    // the token is really in the file (so the stripped absence is the
    // stripper's doing); stripped-absent is the claim itself.
    expect(
      readRaw(VIEW_SRC),
      'the amended comment no longer spells `event.metaKey`, so the stripped absence below proves nothing — re-anchor this control',
    ).toContain('event.metaKey');
    expect(readCode(VIEW_SRC)).not.toContain('event.metaKey');
  });

  it('`handleRowClick`\'s branches read no modifier key — the comment\'s "do NOT read it"', () => {
    const body = handleRowClickBody(readCode(VIEW_SRC));
    expect(body, `${VIEW_SRC} — \`handleRowClick\` anchor not found; this case answered about nothing`).not.toBeNull();
    for (const read of ['metaKey', 'ctrlKey', 'button']) {
      expect(
        body,
        `\`handleRowClick\` now reads \`${read}\` — it ACTS on the modifier payload, and the comment above it says it does not`,
      ).not.toContain(read);
    }
    // Live-instrument control: the same slice DOES contain what it should, so a
    // pass above cannot be an empty string quietly containing nothing.
    expect(body).toContain('onRowClick(record, event)');
  });

  it('the hook returns EARLY on that handler, AHEAD of its modifier branch — the ordering the comment rests on', () => {
    const hook = readCode(HOOK_SRC);
    const earlyReturn = hook.indexOf('onRowClick(record, event)');
    const modifierRead = hook.indexOf('event.metaKey');
    expect(earlyReturn, `${HOOK_SRC} — the forwarding call is gone`).toBeGreaterThan(-1);
    expect(modifierRead, `${HOOK_SRC} — the modifier read is gone`).toBeGreaterThan(-1);
    expect(
      earlyReturn,
      'the hook now reads the modifier payload BEFORE handing the click to `onRowClick` — the branch is reachable from ObjectView again and the comment must be amended with this pin',
    ).toBeLessThan(modifierRead);
  });

  it('pins why the presence leg is keyed on the READ spelling and not on a bare identifier', () => {
    const hook = readCode(HOOK_SRC);
    // A DECLARATION survives the strip. `metaKey?: boolean` on the payload type
    // is code, so a bare-identifier probe is satisfied by a hook that reads
    // nothing at all — which is the exact failure this file must be able to
    // see. The two answers are pinned side by side so they are never confused.
    expect(hook, 'the declaration is code and survives the strip').toContain('metaKey?: boolean');
    expect(hook, 'the READ is the spelling that carries the claim').toContain('event.metaKey');
  });
});

describe('objectui#9806 — the handshake: the comment cites THIS pin, by a name derived rather than typed', () => {
  it('ObjectView.tsx names this file, so a rename or a rewrite that drops the citation reds', () => {
    const myName = path.basename(fileURLToPath(import.meta.url));
    // ⚠️ Deliberately read off the RAW bytes: the citation lives in the comment,
    // and the comment is the subject here. This is the one case in the file for
    // which prose is the point rather than the hazard.
    expect(
      readRaw(VIEW_SRC),
      `\`${VIEW_SRC}\`'s comment no longer cites \`${myName}\` — either this pin was renamed, or the comment was rewritten without its instrument, and AGENTS.md #9 forbids the second`,
    ).toContain(myName);
  });
});
