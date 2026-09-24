/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9736 — the three hand-written TypeScript twins take the spec BY
 * REFERENCE, the way their zod mirrors do (ruling batch #167 item 4, letter 甲).
 *
 * `AppComponentSchema` / `DashboardComponentSchema` / `PageNodeSchema` each
 * extend `Omit< App | Dashboard | Page, … >` over the SAME `as const` exclusion
 * array their mirror's `specFieldsExcept` call reads (`APP_SPEC_EXCLUDED`,
 * `DASHBOARD_SPEC_EXCLUDED`, `PAGE_SPEC_EXCLUDED`), plus — on the TypeScript
 * face only — the twin members whose hand-written type is not assignable to
 * the spec's (`header` on the dashboard, `slots` on the page, both already
 * ledgered as drift in `zod-mirror-parity.test.ts`), plus the page's
 * `assignedProfiles`, which objectstack `main` retires (a forward-compat
 * omission, objectui#9409).
 *
 * ## Why the positive pins are TYPE equalities, not assignments
 *
 * `BaseSchema` carries `[key: string]: any`, so an object literal carrying ANY
 * key compiles against these interfaces whether or not the key is declared —
 * an "it compiles" pin would be green on the tree before this change. So:
 *   - declared-ness is read through `DeclaredKeys`, which filters the index
 *     signature out (`string extends K`);
 *   - member types are compared with `Equal`, against the spec's own member;
 *   - the tombstone half is a `@ts-expect-error` on an authored value, which
 *     only sticks BECAUSE the key is now declared (the index signature would
 *     have absorbed it as `any` — `dashboard-aria-retired-contract-twins` is the
 *     record of that pin not sticking before).
 *
 * Real enforcement because `packages/types/tsconfig.test.json` is chained from
 * this package's `type-check` script; the runtime half asserts the mirror
 * gives the same verdict on the same literal.
 */

import { describe, it, expect } from 'vitest';
import type { App, Dashboard, Page } from '@objectstack/spec/ui';
import type { AppComponentSchema } from '../app';
import type { DashboardComponentSchema } from '../complex';
import type { PageNodeSchema } from '../layout';
import {
  AppComponentSchema as AppMirror,
  DashboardComponentSchema as DashboardMirror,
  PageNodeSchema as PageMirror,
} from '../zod/index.zod';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type DeclaredKeys<T> = keyof { [K in keyof T as string extends K ? never : K]: T[K] };

/** Keys the spec's document type declares that the twin does NOT declare. */
type SpecKeysUndeclaredOn<Spec, Twin> = Exclude<keyof Spec, DeclaredKeys<Twin>>;

describe('each twin declares every key its spec document type declares', () => {
  it('App / Dashboard / Page: the spec-minus-declared key set is empty', () => {
    // Before objectui#9736 these read as the MirroredUndeclared rows (20 / 11 / 10
    // keys). ⭐ Control: `DeclaredKeys` must see real members, or `never` above is
    // vacuous — `protection` / `requires` are keys ONLY the spec projection brings.
    const app: Equal<SpecKeysUndeclaredOn<App, AppComponentSchema>, never> = true;
    const dashboard: Equal<SpecKeysUndeclaredOn<Dashboard, DashboardComponentSchema>, never> = true;
    const page: Equal<SpecKeysUndeclaredOn<Page, PageNodeSchema>, never> = true;
    const controlApp: 'protection' extends DeclaredKeys<AppComponentSchema> ? true : false = true;
    const controlPage: 'requires' extends DeclaredKeys<PageNodeSchema> ? true : false = true;
    const controlNegative: 'notASpecKey9736' extends DeclaredKeys<AppComponentSchema> ? true : false = false;
    expect([app, dashboard, page, controlApp, controlPage, controlNegative]).toEqual([true, true, true, true, true, false]);
  });
});

describe('admitted spec keys land on the twin with the SPEC\'S type, not `any`', () => {
  it('the package-lock envelope and document keys equal the spec member', () => {
    const lock: Equal<AppComponentSchema['_lock'], App['_lock']> = true;
    const appProtection: Equal<AppComponentSchema['protection'], App['protection']> = true;
    const defaultAgent: Equal<AppComponentSchema['defaultAgent'], App['defaultAgent']> = true;
    const dashProtection: Equal<DashboardComponentSchema['protection'], Dashboard['protection']> = true;
    const dashPackageId: Equal<DashboardComponentSchema['_packageId'], Dashboard['_packageId']> = true;
    const pageSource: Equal<PageNodeSchema['source'], Page['source']> = true;
    const pageRequires: Equal<PageNodeSchema['requires'], Page['requires']> = true;
    const pageInterfaceConfig: Equal<PageNodeSchema['interfaceConfig'], Page['interfaceConfig']> = true;
    // Control: an undeclared key reads as `any` through the index signature, and
    // `Equal` tells `any` apart from a real member type.
    const anyControl: Equal<AppComponentSchema['notASpecKey9736'], App['_lock']> = false;
    expect([lock, appProtection, defaultAgent, dashProtection, dashPackageId, pageSource, pageRequires, pageInterfaceConfig, anyControl])
      .toEqual([true, true, true, true, true, true, true, true, false]);
  });

  it('`contextSelectors` — withheld from the projection — is declared over the mirror\'s own element', () => {
    const declared: 'contextSelectors' extends DeclaredKeys<AppComponentSchema> ? true : false = true;
    const selectors: AppComponentSchema['contextSelectors'] = [
      { id: 'pkg', label: 'Package', optionsSource: { endpoint: '/api/v1/packages' } },
    ];
    expect(declared).toBe(true);
    expect(AppMirror.safeParse({ type: 'app', contextSelectors: selectors }).success).toBe(true);
  });
});

describe('spec tombstones surface on the twin as a refusal — the verdict the mirror gives', () => {
  it('App `version` / Dashboard `refreshInterval`: authoring a value is a compile error AND a parse failure', () => {
    // @ts-expect-error — `version` is the spec's `retiredKey()` tombstone.
    const app: AppComponentSchema = { type: 'app', version: '1.0.0' };
    // @ts-expect-error — `refreshInterval` is the #15680 rename's tombstone.
    const dashboard: DashboardComponentSchema = { type: 'dashboard', widgets: [], refreshInterval: 30 };
    expect(AppMirror.safeParse(app).success).toBe(false);
    expect(DashboardMirror.safeParse(dashboard).success).toBe(false);
  });

  it('the controls: the same documents without the tombstone key pass both faces', () => {
    const app: AppComponentSchema = { type: 'app' };
    const dashboard: DashboardComponentSchema = { type: 'dashboard', widgets: [], refreshIntervalSeconds: 30 };
    expect(AppMirror.safeParse(app).success).toBe(true);
    expect(DashboardMirror.safeParse(dashboard).success).toBe(true);
  });

  it('`Page` carries no tombstone on the installed pin — its admitted keys pass both faces', () => {
    // ⚠️ Recorded rather than assumed: the spec's `PageSchema` has no
    // `retiredKey()` member on @objectstack/spec 17.4.0, so the page twin's pin
    // is the admitted half only.
    const page: PageNodeSchema = { type: 'page', source: 'pages/home.tsx', requires: ['crm'] };
    expect(PageMirror.safeParse(page).success).toBe(true);
  });
});

describe('the twin-only omissions keep the twin\'s own member, unwidened', () => {
  it('Dashboard `header` and Page `slots` are the hand-written types, not the spec\'s', () => {
    type HeaderAction = NonNullable<NonNullable<DashboardComponentSchema['header']>['actions']>[number];
    const headerLabel: Equal<HeaderAction['label'], string> = true;
    const headerNotSpec: Equal<DashboardComponentSchema['header'], Dashboard['header']> = false;
    const slotsNotSpec: Equal<PageNodeSchema['slots'], Page['slots']> = false;
    expect([headerLabel, headerNotSpec, slotsNotSpec]).toEqual([true, false, false]);
  });

  it('Page `assignedProfiles` keeps the hand-written `string[]` whatever the spec pin declares', () => {
    // A FORWARD-COMPAT omission: objectstack `main` retires the key (its input
    // type becomes `undefined`), and the hand-written member would then stop
    // compiling in the `extends` clause. Spelling it beside the shared list keeps
    // the twin compiling against both the installed pin and `main` (the
    // `Spec Main Shape Gate`). Retiring it is objectui#9409's decision, ⛔ not
    // this file's, so the member must stay exactly what it was.
    const assignedProfiles: Equal<PageNodeSchema['assignedProfiles'], string[] | undefined> = true;
    const declared: 'assignedProfiles' extends DeclaredKeys<PageNodeSchema> ? true : false = true;
    expect([assignedProfiles, declared]).toEqual([true, true]);
  });
});
