/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `object-grid` NORMALIZES before it joins `$orderby` (objectui#8973).
 *
 * ## What was wrong
 *
 * This block lowers `schema.sort` with private code rather than the shared
 * sink, and its array arm was a bare template interpolation:
 *
 *     params.$orderby = schemaSort.map((s: any) => `${s.field} ${s.order}`).join(', ');
 *
 * Every key was interpolated UNCONDITIONALLY, so an entry missing `field` or
 * `order` reached the wire as the literal text `undefined`. The legacy
 * `defaultSort` arm one `else` down had the identical defect on a single
 * object.
 *
 * ## Why this is a wire defect and not a cosmetic one — MEASURED, not assumed
 *
 * `normalizeSortNodes` (`@objectstack/metadata-protocol`, the one normalizer
 * every server ingress funnels through) reads the join string by splitting on
 * whitespace and validating the direction token:
 *
 *   - `"name undefined"` → direction `'undefined'`, "neither 'asc' nor 'desc'"
 *     → **`400 INVALID_QUERY`**. The list does not render degraded; it fails.
 *   - `"undefined desc"` → a WELL-FORMED sort on a column literally named
 *     `undefined` — the silently-wrong-ordering half of the same defect.
 *   - `""` → `[]`, i.e. benign at the server. Omitting the key is still the
 *     correct lowering, and it is the correction `toFilterNode` already made
 *     for `$filter: {}` on the filter leg of this very same query build:
 *     asking a question with no content is not the same as not asking.
 *
 * ## The wire shape does NOT move here
 *
 * The join string stays. Routing this arm through `convertSortToQueryParams`
 * would send that sink's `{field: direction}` map — route B on objectui#8767,
 * DECLINED by the maintainer on 2026-09-10 pending a card that measures the
 * server contract AND both readers. What IS shared is the decision the two
 * copies disagreed about: `normalizeSortEntries`, exported from
 * `@object-ui/core` alongside the map builder that now also delegates to it.
 * One operation, one implementation — for the operation that had two copies.
 *
 * ## Deliberately untouched
 *
 * The header-arrow reader `parseSchemaSort` (objectui#8961, `pm:blocked`) and
 * the export path's `{field, direction}` projection. The `headerSort` arm also
 * keeps sending `SortNode[]` objects rather than a join string — a documented,
 * deliberate difference, not a defect.
 *
 * ⭐ The CONTROL rows are what make the rest a measurement rather than a block
 * that mangles everything: if the fix had broken lowering outright, the
 * `"name desc"` rows would have gone dark and every "key is absent" assertion
 * would have passed for the wrong reason.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { resetRetiredSortSpellingReports } from '@object-ui/core';
// Registers `object-grid` and its `view:grid` alias.
import '../index';

/**
 * The repo root, derived from THIS FILE's own location — never from
 * `process.cwd()` (objectui#7799, and the gate that closed the class,
 * objectui#8953).
 *
 * The read below stood on `join(process.cwd(), …)` under the comment "Read off
 * the vitest root — this project's `import.meta.url` is not a file URL, so the
 * sibling `import.meta`-relative idiom does not work here". BOTH HALVES OF THAT
 * ARE FALSE, and each had already been falsified before this file was written:
 *
 *  - `import.meta.url` IS a `file:` URL in this project. objectui#7800
 *    (comment 5555131785) measured it across three packages and both cwds; the
 *    sibling `packages/plugin-grid/src/__tests__/groupedPartialDisclosure-7189.test.tsx`
 *    has derived its root this way since PR #7806. What Vite rewrites is the
 *    TWO-ARGUMENT `new URL(rel, import.meta.url)`, which is why only the bare
 *    form is read here and taken apart by hand.
 *  - "the vitest root" and `process.cwd()` are not the same directory. This
 *    package's own `test` script — `vitest run --root ../.. packages/plugin-grid/`,
 *    which is what `pnpm --filter @object-ui/plugin-grid test` and
 *    `turbo run test` both run — sets the VITEST root to the repo root and
 *    leaves the cwd in `packages/plugin-grid/`, so the path below resolved to
 *    `packages/plugin-grid/packages/plugin-grid/src/ObjectGrid.tsx` and the read
 *    threw (objectui#7791, objectui#7799).
 */
const SELF_DEPTH_BELOW_REPO_ROOT = 5; // packages / plugin-grid / src / __tests__ / this file
const REPO_ROOT = decodeURIComponent(new URL(import.meta.url).pathname)
  .split('/')
  .slice(0, -SELF_DEPTH_BELOW_REPO_ROOT)
  .join('/');

function makeAdapter() {
  return {
    find: vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Acme', status: 'active' }],
      total: 1,
    }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({
      name: 'account',
      fields: { id: { type: 'text' }, name: { type: 'text' }, status: { type: 'text' } },
    }),
  };
}

/** Render the block and return the params of its first `find` call. */
async function findParamsFor(schema: Record<string, unknown>) {
  const adapter = makeAdapter();
  render(
    <SchemaRendererProvider dataSource={adapter as any}>
      <SchemaRenderer schema={schema as any} />
    </SchemaRendererProvider>,
  );
  await waitFor(() => expect(adapter.find).toHaveBeenCalled());
  return (adapter.find.mock.calls[0] as [string, any])[1];
}

const BASE = { type: 'object-grid', objectName: 'account', columns: [{ field: 'name' }] };

/** `$orderby` is absent ENTIRELY — not present-and-empty. */
function expectNoOrderBy(params: Record<string, unknown>) {
  expect(params.$orderby).toBeUndefined();
  expect(Object.prototype.hasOwnProperty.call(params, '$orderby')).toBe(false);
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetRetiredSortSpellingReports();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe('object-grid array `sort` arm — the card’s six-row probe table (objectui#8973)', () => {
  it('CONTROL — a fully-specified entry still lowers to the join string, byte for byte', async () => {
    const params = await findParamsFor({ ...BASE, sort: [{ field: 'name', order: 'desc' }] });
    // The wire shape route B would change and this card keeps.
    expect(params.$orderby).toBe('name desc');
  });

  it('`order` omitted lowers to `asc` — it used to go out as `"name undefined"`', async () => {
    const params = await findParamsFor({ ...BASE, sort: [{ field: 'name' }] });
    expect(params.$orderby).toBe('name asc');
    expect(params.$orderby).not.toContain('undefined');
  });

  it('normalizes only the member that is missing one, leaving its neighbour alone', async () => {
    const params = await findParamsFor({
      ...BASE,
      sort: [{ field: 'name', order: 'desc' }, { field: 'status' }],
    });
    // Was `"name desc, status undefined"`.
    expect(params.$orderby).toBe('name desc, status asc');
  });

  it('an empty array carries NO `$orderby` — it used to send `""`', async () => {
    expectNoOrderBy(await findParamsFor({ ...BASE, sort: [] }));
  });

  it('the retired ARRAY-OF-STRINGS form names no field, so nothing survives', async () => {
    const params = await findParamsFor({ ...BASE, sort: ['name desc'] });
    // Was `"undefined undefined"` — a hard 400 at the server.
    expectNoOrderBy(params);
    // ⚠️ Deliberately NOT a new refusal diagnostic. objectui#8767 landed route
    // C for the retired STRING clause; widening that refusal to cover the
    // array-of-strings is that card's business, not this one's. This entry is
    // dropped exactly as the shared sink drops an unusable entry — silently.
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('`field` omitted names nothing to order by, so the entry is skipped', async () => {
    // Was `"undefined desc"` — a well-formed sort on a column named `undefined`.
    expectNoOrderBy(await findParamsFor({ ...BASE, sort: [{ order: 'desc' }] }));
  });

  it('drops only the unusable members of a mixed array, keeping the usable one', async () => {
    const params = await findParamsFor({
      ...BASE,
      sort: [{ order: 'desc' }, { field: 'name' }],
    });
    expect(params.$orderby).toBe('name asc');
  });
});

describe('object-grid legacy `defaultSort` arm — the SAME defect, one `else` down (objectui#8973)', () => {
  it('CONTROL — a fully-specified `defaultSort` still lowers to the join string', async () => {
    const params = await findParamsFor({ ...BASE, defaultSort: { field: 'name', order: 'desc' } });
    expect(params.$orderby).toBe('name desc');
  });

  it('`order` omitted lowers to `asc` — it used to go out as `"name undefined"`', async () => {
    const params = await findParamsFor({ ...BASE, defaultSort: { field: 'name' } });
    expect(params.$orderby).toBe('name asc');
    expect(params.$orderby).not.toContain('undefined');
  });

  it('`field` omitted carries NO `$orderby` — it used to send `"undefined desc"`', async () => {
    expectNoOrderBy(await findParamsFor({ ...BASE, defaultSort: { order: 'desc' } }));
  });
});

describe('object-grid — the arms this card deliberately does NOT move', () => {
  it('a header-click sort still sends `SortNode[]` objects, not a join string', () => {
    // Named rather than absorbed (the triage comment asked for exactly this):
    // this block already sends TWO different `$orderby` shapes depending on
    // which arm fires, and that predates this card. The `SortNode[]` form is
    // documented at the read site as deliberate — it is the shape the server
    // names in its own error messages and it survives a field name containing
    // a space. Both shapes are accepted by `normalizeSortNodes`.
    // Rooted at this file, never at the cwd — see `REPO_ROOT` above.
    const src = readFileSync(join(REPO_ROOT, 'packages/plugin-grid/src/ObjectGrid.tsx'), 'utf8');

    // Instrument check FIRST, in both directions: a probe that silently read
    // the wrong file (or an empty one) would make every `toContain` below a
    // vacuous pass, and a `not.toContain` a vacuous one at that.
    expect(src).toContain('export function parseSchemaSort');
    expect(src).not.toContain('a token that is definitely not in this file');

    expect(src).toContain('params.$orderby = headerSort.map((s) => ({ field: s.field, order: s.order }));');
  });

  it('the string `sort` arm is still objectui#8767’s refusal, unchanged', async () => {
    const params = await findParamsFor({ ...BASE, sort: 'name desc' });
    expectNoOrderBy(params);
    // #8758's OWN diagnostic still fires — this card did not absorb it.
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls[0][0])).toContain('objectui#8221');
  });
});
