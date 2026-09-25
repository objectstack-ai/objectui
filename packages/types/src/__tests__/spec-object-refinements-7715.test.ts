/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The spec-derived mirrors carry the spec's OBJECT-LEVEL checks (objectui#7715,
 * ruling B1, director seat, decision batch #67, maintainer 「同意」).
 *
 * ## The defect
 *
 * A mirror built as `specFieldsExcept(SpecX.shape, …)` is a fresh `ZodObject`:
 * it takes the spec's FIELDS by reference and leaves behind every check the
 * spec attached to the OBJECT (`superRefine` / `refine`). So objectui's
 * authoring door accepted a document the spec's publish door refuses — the
 * direction that gives an author, human or AI, no signal until publish.
 *
 * ## The tripwire (objectui#7122 item 6, option A — the control this card flips)
 *
 * The measured divergence: `appearance.allowedVisualizations: ['calendar']`
 * with no `calendar:` block. The spec refuses it (its
 * `checkListViewCalendarVisualization`); objectui's `ListViewSchema` accepted
 * it. The pin below asserts PARITY, so it was red on the base this card
 * branched from and turns green only when the mirror re-attaches the spec's
 * own exported check. Both legs are asserted: the spec-side refusal is re-read
 * live on every run, so a spec release that drops the rule turns this red
 * rather than leaving a pin that compares two acceptances.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import {
  AppSchema as SpecAppSchema,
  DashboardSchema as SpecDashboardSchema,
  DashboardWidgetSchema as SpecDashboardWidgetSchema,
  GlobalFilterSchema as SpecGlobalFilterSchema,
  ListViewSchema as SpecListViewSchema,
  NavigationAreaSchema as SpecNavigationAreaSchema,
  PageSchema as SpecPageSchema,
  checkGlobalFilterDateDefaultValue,
  checkListViewCalendarVisualization,
  checkListViewPageMount,
  checkPageSourceCompleteness,
} from '@objectstack/spec/ui';
import { ListViewSchema, PageNodeSchema, safeValidateSchema } from '../zod/index.zod';
import { GlobalFilterSchema } from '../zod/complex.zod';

/** The spec-shaped view: the spec requires `columns`, objectui does not. */
const specView = (extra: Record<string, unknown>) => ({ columns: ['name'], ...extra });
/** The objectui node for the same view: component discriminator + object binding. */
const node = (extra: Record<string, unknown>) => ({ type: 'list-view', objectName: 'accounts', ...extra });

const CALENDAR_OFFERED_NO_BLOCK = { appearance: { allowedVisualizations: ['calendar'] } };

describe('objectui#7715 — tripwire: the ListView calendar-visualization refusal reaches objectui', () => {
  it('the spec refuses the document, at `calendar` (the premise, re-read live)', () => {
    const r = SpecListViewSchema.safeParse(specView(CALENDAR_OFFERED_NO_BLOCK));
    expect(r.success).toBe(false);
    const issue = r.error!.issues.find((i) => i.path.join('.') === 'calendar');
    expect(issue?.code).toBe('custom');
  });

  it('objectui refuses the same document with the spec\'s own issue — mirror and published door', () => {
    const spec = SpecListViewSchema.safeParse(specView(CALENDAR_OFFERED_NO_BLOCK));
    const specIssue = spec.error!.issues.find((i) => i.path.join('.') === 'calendar')!;

    for (const r of [ListViewSchema.safeParse(node(CALENDAR_OFFERED_NO_BLOCK)), safeValidateSchema(node(CALENDAR_OFFERED_NO_BLOCK))]) {
      expect(r.success).toBe(false);
      const issues = r.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message }));
      // The spec's issue, derived from the spec's own parse — not a restated
      // message — so this proves the spec's check runs here, not a copy of it.
      expect(issues).toContainEqual({ code: 'custom', path: 'calendar', message: specIssue.message });
    }
  });

  it('controls: a declared `calendar` block, and a list that does not offer the calendar, pass on both doors', () => {
    const withBlock = { ...CALENDAR_OFFERED_NO_BLOCK, calendar: { startDateField: 'starts_at' } };
    const noCalendar = { appearance: { allowedVisualizations: ['grid', 'kanban'] } };
    for (const extra of [withBlock, noCalendar]) {
      expect(SpecListViewSchema.safeParse(specView(extra)).success).toBe(true);
      expect(ListViewSchema.safeParse(node(extra)).success).toBe(true);
      expect(safeValidateSchema(node(extra)).success).toBe(true);
    }
  });
});

// ── The Page site ────────────────────────────────────────────────────────────

const specPage = (extra: Record<string, unknown>) => ({ name: 'home_page', label: 'Home', ...extra });
const pageNode = (extra: Record<string, unknown>) => ({ type: 'page', ...extra });

describe('objectui#7715 — the Page source-completeness refusal reaches objectui', () => {
  it.each([
    ['no `source` at all', { kind: 'html' }],
    ['a whitespace-only `source`', { kind: 'react', source: '   ' }],
  ])('%s: the spec refuses at `source`, and objectui refuses with the spec\'s own issue', (_label, extra) => {
    const spec = SpecPageSchema.safeParse(specPage(extra));
    expect(spec.success).toBe(false);
    const specIssue = spec.error!.issues.find((i) => i.path.join('.') === 'source');
    expect(specIssue?.code).toBe('custom');

    for (const r of [PageNodeSchema.safeParse(pageNode(extra)), safeValidateSchema(pageNode(extra))]) {
      expect(r.success).toBe(false);
      const issues = r.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message }));
      expect(issues).toContainEqual({ code: 'custom', path: 'source', message: specIssue!.message });
    }
  });

  it('controls: a sourced page, and a page whose kind carries no source, pass on both doors', () => {
    for (const extra of [{ kind: 'html', source: '<section>x</section>' }, {}, { kind: 'full' }]) {
      expect(SpecPageSchema.safeParse(specPage(extra)).success).toBe(true);
      expect(PageNodeSchema.safeParse(pageNode(extra)).success).toBe(true);
      expect(safeValidateSchema(pageNode(extra)).success).toBe(true);
    }
  });
});

// ── The census: every object-level check the spec runs is accounted for ─────

/**
 * The six `specFieldsExcept(...)` derivation sites the ruling names, each with
 * the spec object it rebuilds and the spec's exported checks it re-attaches or
 * declares not attachable (with the reason, which the pin below measures where
 * it can). A site's two lists must account for EVERY object-level check the
 * spec object carries today, read off `_zod.def.checks` — so a check the spec
 * adds on a later release reddens this row by name instead of being dropped.
 */
const SITES = [
  { site: 'NavigationAreaSchema (app.zod.ts)', spec: SpecNavigationAreaSchema, attached: [], notAttachable: [] },
  { site: 'SpecAppFields → AppComponentSchema (app.zod.ts)', spec: SpecAppSchema, attached: [], notAttachable: [] },
  { site: 'DashboardWidgetSchema (complex.zod.ts)', spec: SpecDashboardWidgetSchema, attached: [], notAttachable: [] },
  { site: 'SpecDashboardFields → DashboardComponentSchema (complex.zod.ts)', spec: SpecDashboardSchema, attached: [], notAttachable: [] },
  { site: 'SpecPageFields → PageNodeSchema (layout.zod.ts)', spec: SpecPageSchema, attached: ['checkPageSourceCompleteness'], notAttachable: [] },
  {
    site: 'ListViewSchema (objectql.zod.ts)',
    spec: SpecListViewSchema,
    attached: ['checkListViewCalendarVisualization'],
    // Reads `type`, which on this node is the component discriminator — see the
    // measurement below.
    notAttachable: ['checkListViewPageMount'],
  },
] as const;

/**
 * Exported checks that belong to NO `specFieldsExcept` site. `GlobalFilterSchema`
 * is mirrored by a `.shape` spread in `complex.zod.ts` whose own `superRefine`
 * re-parses the spec-owned keys through the spec schema, so its check already
 * runs there — measured below rather than assumed.
 */
const CARRIED_ELSEWHERE = ['checkGlobalFilterDateDefaultValue'] as const;

/** The bindings behind every name above, so each is proven a live function. */
const SPEC_CHECK_BINDINGS: Record<string, unknown> = {
  checkGlobalFilterDateDefaultValue,
  checkListViewCalendarVisualization,
  checkListViewPageMount,
  checkPageSourceCompleteness,
};

/**
 * The `check*` FUNCTIONS `@objectstack/spec/ui` exports, read from the spec's own
 * published export surface (`api-surface/ui.json`, every `name (kind)` of the
 * entry point, generated from the built `dist`) rather than from a runtime
 * namespace import — a namespace import of `@objectstack/spec/ui` is restricted
 * in this repository, for reasons that have nothing to do with this census.
 */
function specCheckExports(): string[] {
  const require = createRequire(import.meta.url);
  const pkgDir = dirname(require.resolve('@objectstack/spec/package.json'));
  const surface = JSON.parse(readFileSync(join(pkgDir, 'api-surface', 'ui.json'), 'utf8')) as { entry: string; exports: string[] };
  expect(surface.entry).toBe('./ui');
  // Control: the surface lists a schema this file imports, so a reading of zero
  // checks would be a real zero and not an unreadable file.
  expect(surface.exports).toContain('ListViewSchema (const)');
  return surface.exports
    .map((e) => /^(check[A-Z]\w*) \(function\)$/.exec(e)?.[1])
    .filter((n): n is string => Boolean(n));
}

const objectLevelChecks = (schema: unknown): number =>
  ((schema as { _zod: { def: { checks?: unknown[] } } })._zod.def.checks ?? []).length;

/** Run one exported check directly, outside any schema. */
const runCheck = (check: unknown, value: unknown) =>
  z.any().superRefine(check as (v: unknown, ctx: z.RefinementCtx) => void).safeParse(value);

describe('objectui#7715 — census: the spec\'s object-level checks at the six derivation sites', () => {
  it.each(SITES.map((s) => [s.site, s] as const))('%s accounts for every object-level check the spec object carries', (_site, s) => {
    expect({
      site: s.site,
      specObjectLevelChecks: objectLevelChecks(s.spec),
    }).toEqual({
      site: s.site,
      specObjectLevelChecks: s.attached.length + s.notAttachable.length,
    });
  });

  it('every `check*` the spec exports is named by exactly one site or carried elsewhere', () => {
    const exported = specCheckExports().sort();
    const named = [...SITES.flatMap((s) => [...s.attached, ...s.notAttachable]), ...CARRIED_ELSEWHERE].sort();
    expect(exported).toEqual(named);
    expect(Object.keys(SPEC_CHECK_BINDINGS).sort()).toEqual(named);
    for (const name of named) expect(typeof SPEC_CHECK_BINDINGS[name], name).toBe('function');
  });

  it('`checkListViewPageMount` is not attachable: it reads `type`, which the list-view node spends on its discriminator', () => {
    // The same page mount, spelled once per face. The spec accepts its own.
    expect(SpecListViewSchema.safeParse({ type: 'page', pageName: 'home_page', columns: [] }).success).toBe(true);
    // Attached as-is, the check would refuse objectui's spelling of it, at
    // `pageName` — the verdict a mirror must never add.
    const asIs = runCheck(checkListViewPageMount, { type: 'list-view', viewType: 'page', pageName: 'home_page', columns: [] });
    expect(asIs.success).toBe(false);
    expect(asIs.error!.issues.map((i) => i.path.join('.'))).toEqual(['pageName']);
  });

  it('`checkGlobalFilterDateDefaultValue` already runs on objectui\'s GlobalFilterSchema, with the spec\'s own issue', () => {
    const bad = { field: 'created_at', type: 'date', defaultValue: 'last_7_dayz' };
    const spec = SpecGlobalFilterSchema.safeParse(bad);
    expect(spec.success).toBe(false);
    const specIssue = spec.error!.issues.find((i) => i.path.join('.') === 'defaultValue')!;
    const mirror = GlobalFilterSchema.safeParse(bad);
    expect(mirror.success).toBe(false);
    expect(mirror.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message })))
      .toContainEqual({ code: 'custom', path: 'defaultValue', message: specIssue.message });
    // Control: a preset name resolves on both.
    const good = { ...bad, defaultValue: 'last_7_days' };
    expect(SpecGlobalFilterSchema.safeParse(good).success).toBe(true);
    expect(GlobalFilterSchema.safeParse(good).success).toBe(true);
  });
});
