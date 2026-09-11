/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9012 — `@object-ui/core`'s DECLARED `@objectstack/spec` floor must
 * admit only specs that accept what this package's own fold produces.
 *
 * The sibling pin `normalize-list-view.foldOutputAuthorable-5435.test.ts` proves
 * the fold's output is authorable against the RESOLVED spec. That is a fact
 * about the lockfile, not about what a consumer installs: `dependencies`
 * declared `^17.2.0`, and a consumer resolution landing on 17.2.x — a sibling
 * pinning it exactly, an `overrides` entry, an offline mirror a minor behind —
 * satisfied that range. This file pins the other half, the DECLARED floor.
 *
 * ## The measurement (objectui#9012, re-derived against published artifacts)
 *
 * Each published 17.x was installed into its own isolated consumer project
 * (`npm install @objectstack/spec@VERSION`, no workspace resolution anywhere)
 * and the fold's real output parsed against that install's own `./ui` entry:
 *
 *   17.0.0  UserActionsConfigSchema declares  8 keys  REFUSED group/hideFields/rowColor
 *   17.1.0  UserActionsConfigSchema declares  8 keys  REFUSED group/hideFields/rowColor
 *   17.2.0  UserActionsConfigSchema declares  8 keys  REFUSED group/hideFields/rowColor
 *   17.3.0  UserActionsConfigSchema declares 11 keys  ACCEPTED
 *   17.4.0  UserActionsConfigSchema declares 11 keys  ACCEPTED
 *
 * A firing control (`zzUndeclared`) was refused by ALL FIVE, so "ACCEPTED" is
 * not the reading of a schema that accepts everything, and "REFUSED" is not the
 * reading of one that refuses everything.
 *
 * ⭐ SECOND, INDEPENDENT ROUTE to the same floor. `ListViewSchema` gained
 * `pageName` in the same release, and `type: 'page'` with it. The fixture
 * `normalize-list-view.pageResidual-8429.test.ts` asserts the spec ACCEPTS is
 * refused by 17.0.0 / 17.1.0 / 17.2.0 (`refused-keys=['pageName']` plus an
 * `invalid_value` on `type`) and accepted from 17.3.0. So the floor below is
 * not propped up by one key family: two independent ones land on it.
 *
 * ⇒ 17.3.0 is the FIRST published version that accepts, verified across the
 * whole published 17.x stable line rather than by taking the first version that
 * happened to work. The line is exactly 17.0.0, 17.1.0, 17.2.0, 17.3.0, 17.4.0
 * — there is no unexamined gap between the last refusing and first accepting
 * release.
 *
 * ## Why this is a test and not a gate extension
 *
 * `scripts/check-spec-range-floors.mjs` judges SYMBOL PRESENCE in the floor's
 * published artifact, and `UserActionsConfigSchema` / `ListViewSchema` are
 * exported by every version above — so that gate is green at `^17.2.0` and
 * would stay green at any floor. The requirement here is BEHAVIOURAL (which
 * KEYS the symbol declares), deliberately outside that gate's criterion; its
 * header argues at length why a behaviour-based criterion there would over-name
 * symbols. Teaching the gate this class is objectui#9012's fourth question and
 * is filed separately rather than smuggled in here.
 */

import { readFileSync } from 'node:fs';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListViewSchema as SpecListViewSchema, UserActionsConfigSchema } from '@objectstack/spec/ui';

import { normalizeListViewSchema } from '../normalize-list-view.js';

/**
 * The first published `@objectstack/spec` that accepts this package's fold
 * output. Measured, not assumed — see the docblock above.
 */
const REQUIRED_FLOOR = '17.3.0';

/** `[major, minor, patch]` of a plain `X.Y.Z`, or `null`. */
const parseVersion = (v: string): [number, number, number] | null => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** The minimum version a `^X.Y.Z` range admits. */
const floorOf = (range: string): string => range.trim().replace(/^[\^~>=\s]+/, '');

/** Whether every version `range` admits is at or above `required`. */
const admitsOnlyAtOrAbove = (range: string, required: string): boolean => {
  const low = parseVersion(floorOf(range));
  const need = parseVersion(required);
  if (!low || !need) return false;
  for (let i = 0; i < 3; i += 1) {
    if (low[i] !== need[i]) return low[i] > need[i];
  }
  return true;
};

const manifest = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { name: string; dependencies?: Record<string, string> };

/** The widest `userActions` block the fold can produce — all seven flags. */
const LEGACY_VIEW = {
  name: 'my_view',
  label: 'My View',
  type: 'grid',
  columns: [{ field: 'name' }],
  showSearch: true,
  showSort: true,
  showFilters: true,
  showDensity: true,
  showGroup: false,
  showHideFields: true,
  showColor: true,
} as const;

/** The three keys adopted in 17.3.0 that made the old floor wrong. */
const ADOPTED_KEYS = ['group', 'hideFields', 'rowColor'] as const;

describe('the DECLARED spec floor admits only specs that accept the fold (objectui#9012)', () => {
  beforeEach(() => {
    // #8372's undrawable-kind warning is developer-facing noise here.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the comparator, proven able to redden before it is trusted', () => {
    it('refuses the floor this card replaced, and every floor below it', () => {
      // ⭐ FIRING CONTROLS. Without these, `admitsOnlyAtOrAbove` returning true
      // for the live manifest is equally consistent with a predicate that
      // returns true for everything.
      expect(admitsOnlyAtOrAbove('^17.2.0', REQUIRED_FLOOR)).toBe(false);
      expect(admitsOnlyAtOrAbove('^17.1.0', REQUIRED_FLOOR)).toBe(false);
      expect(admitsOnlyAtOrAbove('^17.0.0', REQUIRED_FLOOR)).toBe(false);
      expect(admitsOnlyAtOrAbove('^16.99.99', REQUIRED_FLOOR)).toBe(false);

      // ... and accepts the floor that measured clean, and later ones.
      expect(admitsOnlyAtOrAbove('^17.3.0', REQUIRED_FLOOR)).toBe(true);
      expect(admitsOnlyAtOrAbove('^17.4.0', REQUIRED_FLOOR)).toBe(true);

      // A range it cannot reason about must not read as satisfied.
      expect(admitsOnlyAtOrAbove('*', REQUIRED_FLOOR)).toBe(false);
      expect(admitsOnlyAtOrAbove('workspace:*', REQUIRED_FLOOR)).toBe(false);
    });
  });

  describe('⭐ the declared range', () => {
    it('declares the spec as a consumer-facing dependency at or above the measured floor', () => {
      const declared = manifest.dependencies?.['@objectstack/spec'];

      // `dependencies`, not `devDependencies`: a dev range floors nothing for
      // anybody, which is why this pin reads that field by name.
      expect(declared, '@objectstack/spec must stay a runtime dependency').toBeTruthy();
      expect(
        admitsOnlyAtOrAbove(declared as string, REQUIRED_FLOOR),
        `declared "${declared}" admits a spec below ${REQUIRED_FLOOR}, which refuses this package's own fold output`,
      ).toBe(true);
    });
  });

  describe('the requirement stays anchored to the spec, not to a number in this file', () => {
    it('still emits exactly the keys the measurement was taken on', () => {
      const out = normalizeListViewSchema(LEGACY_VIEW) as Record<string, unknown>;
      const ua = out.userActions as Record<string, unknown>;

      // If the fold stops emitting these, REQUIRED_FLOOR is answering a
      // question nobody is asking any more and this pin must be revisited.
      for (const key of ADOPTED_KEYS) expect(Object.keys(ua)).toContain(key);
    });

    it('requires a spec that declares every key the floor was chosen for', () => {
      const specKeys = Object.keys(UserActionsConfigSchema.shape);
      for (const key of ADOPTED_KEYS) expect(specKeys).toContain(key);

      // The second, independent route to the same floor: `pageName` on a whole
      // ListView document (objectui#8429's fixture, refused before 17.3.0).
      const page = SpecListViewSchema.safeParse({
        name: 'account_page',
        type: 'page',
        pageName: 'crm_welcome',
        columns: [],
      });
      expect(page.success, '`pageName` on a `page` view must be authorable').toBe(true);
    });
  });
});
