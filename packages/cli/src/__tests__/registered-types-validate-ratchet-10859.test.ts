/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * How many REGISTERED component types does `objectui validate` refuse at
 * `type`? A ratchet (objectui#10859).
 *
 * ## The gap this closes
 *
 * `objectui validate` judges a document with `safeValidateSchema`, whose root
 * is `AnyComponentSchema` — a union discriminated on `type`. A registered type
 * with no arm in that union is refused with one `invalid_union` issue at
 * `['type']`, whatever else the document says: `ai-form-assist`, which
 * `packages/plugin-ai/README.md` teaches, was one of them. The mirror-parity
 * ratchet in `@object-ui/types` counts declaration↔mirror PAIRS and the keys
 * inside them; a registered type with no mirror at all is in neither, so
 * nothing counted this family until this file.
 *
 * ## What is counted, and against what
 *
 * The population is the bare (un-namespaced) keys of `KNOWN_SCHEMA_TYPES`
 * (`../utils/known-schema-types.ts`), the list generated from the registration
 * calls themselves, which `objectui check` already uses. A key is REFUSED when
 * `safeValidateSchema({ type: KEY })` fails with an `invalid_union` issue at
 * path `['type']` — the "no arm claims this literal" reading. A key whose arm
 * exists but wants more than the bare `type` (a required member) is not
 * refused here: its `type` is claimed, and the missing member is the
 * document's problem, not the union's.
 *
 * ## The pin moves ONE way
 *
 * `REFUSED_AT_TYPE` is the head's count. objectui#10859 lowers it batch by
 * batch as each registered, declared type gets its arm (or, for a type that is
 * not meant to be authored, as the seat rules on it). ⛔ It never rises: a
 * registration added without an arm, or an arm removed, turns this file red
 * with the refused keys listed, which is where the next author finds out.
 * ⛔ Do not raise the constant to make it pass — arm the type, or take the
 * registration's authorability to the card.
 *
 * ## The namespaced half (objectui#10872)
 *
 * The same list carries the NAMESPACED keys (`view:grid`, `record:details`,
 * `action:button`), and the same union refuses them the same way. They are
 * counted separately, against `NAMESPACED_REFUSED_AT_TYPE`, because they are a
 * separate family card with its own batches — objectui#10872 — and a single
 * total would let a batch on one card mask a regression on the other. Same
 * rule, same direction: the pin is the head's count, it falls with each batch,
 * and ⛔ it never rises.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { safeValidateSchema } from '@object-ui/types/zod';

import { KNOWN_SCHEMA_TYPES } from '../utils/known-schema-types.js';
import { validate } from '../commands/validate.js';

/**
 * The head's refused count (objectui#10859 batch 1: 79 on `main` before it,
 * minus the three `@object-ui/plugin-ai` arms; batch 2: minus `pivot`,
 * `object-metric` and `object-master-detail-form`; batch 3: minus
 * `object-timeline`, armed from its `@objectstack/spec` 17.5.0 row; batch 7:
 * minus the six `@object-ui/plugin-designer` keys; batch 8: minus the thirty
 * (iii) keys RETIRED rather than armed — the 28 bare field-widget fallbacks
 * and the `tree` / `view` aliases, see `RETIRED_BARE_KEYS_10859_BATCH_8`;
 * batch 8 phase 2b: minus twelve more RETIRED keys, see
 * `RETIRED_BARE_KEYS_10859_BATCH_8_PHASE_2B`; batch 8 phase 2c: minus four
 * more, see `UNREGISTERED_10859_BATCH_8_PHASE_2C`; objectui#11441, run as one
 * more batch of this card: minus `navigation-renderer` and `responsive-grid`,
 * see `UNREGISTERED_11441`). LOWER it when a batch arms or retires more keys;
 * never raise it.
 *
 * The 18 that remain are named in `STILL_REFUSED_10859`, and the row below
 * pins the refused set to exactly that list, so this comment cannot drift from
 * the measurement:
 *
 * - the eight the seat ruling left registered — `object-pivot`,
 *   `embeddable-form`, `detail-section`, `home`, `record`, `utility`,
 *   `spec-report` and `app-schema-renderer` (objectui#11440, which arms them).
 *   `navigation-renderer` and `responsive-grid`, the two the seat sent to the
 *   maintainer, were ruled B / B on objectui#11441 (record `5950208338`) and
 *   are retired;
 * - the ten `sidebar-*` primitives, phase 2b's third fork. The seat's fork
 *   ruling (`5948252391`) chose A, conditionally: the armed `sidebar` supplies
 *   its own `SidebarProvider` when no provider is above it, the teaching is
 *   rewritten to that node, and the ten retire in phase 2d.
 *
 * Phase 2b's other forks are closed by the same ruling and retired in phase 2c:
 * `pie-chart`, `donut-chart` and `radar-chart` once
 * `@object-ui/plugin-charts`' `examples/chart-examples.ts`, their one producer,
 * moved to `{ type: 'chart', chartType }`; and `page-header`, whose phase-2b
 * reason was a misreading. objectstack's `page-header-subtitle-alias`
 * conversion renames the KEY `description` → `subtitle` on both header
 * spellings. Its docblock says it does not rewrite the type, and that the type
 * registration is objectui's to retire on its own schedule; its fixtures are
 * test data, not producers.
 *
 * The seat's projection was 10 after phase 2d and 2 after objectui#11440, the
 * last 2 waiting on objectui#11441. That card ran first, so the projection is
 * now 8 after phase 2d and 0 after objectui#11440.
 */
const REFUSED_AT_TYPE = 18;

/**
 * The head's refused count over the NAMESPACED keys (objectui#10872 batch 1:
 * 418 on `main` before it, minus the twenty ADR-0080 public blocks armed from
 * their `@objectstack/spec` `ComponentPropsMap` rows; batch 2: minus
 * `element:number`, armed with the spec's `dataSource` waiver; batch 4: minus
 * the six blocks `@objectstack/spec` 17.5.0 gave a row; objectui#10859 batch 8:
 * minus `view:tree` and `plugin-view:view`, the namespaced twins of the `tree` /
 * `view` aliases it unregistered; objectui#10859 batch 8 phase 2b: minus the
 * ten namespaced twins of the keys it unregistered — `plugin-charts:scatter-chart`,
 * `plugin-dashboard:dashboard-grid`, `plugin-form:form-analytics`,
 * `plugin-grid:import-wizard`, `view:shared-view-link`, the four
 * `plugin-designer:` keys and `plugin-detail:related-list`; objectui#10859
 * batch 8 phase 2c: minus the five namespaced twins of the four keys it
 * unregistered — `plugin-charts:pie-chart`, `plugin-charts:donut-chart`,
 * `plugin-charts:radar-chart`, `layout:page-header` and
 * `protocol-placeholder:page-header`; objectui#11441: minus
 * `layout:navigation-renderer` and `layout:responsive-grid`, the namespaced
 * twins of the two keys it unregistered). LOWER it when a batch arms or retires
 * more keys; never raise it.
 */
const NAMESPACED_REFUSED_AT_TYPE = 372;

/** The bare registry keys — the population the card measured. */
const BARE_KEYS = KNOWN_SCHEMA_TYPES.filter((key) => !key.includes(':'));

/** The namespaced registry keys — objectui#10872's population. */
const NAMESPACED_KEYS = KNOWN_SCHEMA_TYPES.filter((key) => key.includes(':'));

/**
 * The public blocks objectui#10872 batch 1 armed — named, so the row below
 * says WHICH keys left the refused set rather than only that the count fell.
 */
const ARMED_PUBLIC_BLOCKS_10872 = [
  'page:header', 'page:tabs', 'page:card', 'page:accordion', 'page:section', 'page:footer', 'page:sidebar',
  'record:details', 'record:highlights', 'record:related_list', 'record:path', 'record:activity',
  'record:discussion', 'record:history', 'record:quick_actions', 'record:reference_rail', 'record:alert',
  'element:text', 'element:button', 'element:divider',
] as const;

/** The public block objectui#10872 batch 2 armed. */
const ARMED_PUBLIC_BLOCKS_10872_BATCH_2 = ['element:number'] as const;

/** The six public blocks objectui#10872 batch 4 armed, held until `@objectstack/spec` 17.5.0 carried their rows. */
const ARMED_PUBLIC_BLOCKS_10872_BATCH_4 = [
  'action:button', 'action:icon', 'action:group', 'action:menu', 'element:definition-list', 'element:repeater',
] as const;

/**
 * The thirty bare keys objectui#10859 batch 8 RETIRED (the seat's ruling on the
 * card), named so the row below says which keys left the population and how:
 * the 28 field-widget fallbacks through `FIELD_TYPES_SKIP_FALLBACK` in
 * `@object-ui/fields` (their `field:TYPE` keys stay), and the `tree` / `view`
 * aliases by unregistration.
 */
const RETIRED_FIELD_FALLBACKS_10859_BATCH_8 = [
  'auto_number', 'boolean', 'checkboxes', 'color', 'currency', 'date', 'datetime',
  'file', 'formula', 'geolocation', 'location', 'lookup', 'master_detail', 'multiselect',
  'number', 'object', 'percent', 'phone', 'qrcode', 'radio', 'rating', 'richtext',
  'signature', 'summary', 'tags', 'url', 'user', 'vector',
] as const;
const RETIRED_BARE_KEYS_10859_BATCH_8 = [...RETIRED_FIELD_FALLBACKS_10859_BATCH_8, 'tree', 'view'] as const;

/**
 * The twelve bare keys objectui#10859 batch 8 phase 2b RETIRED (the seat's
 * ruling `5945530142`, as amended by `5945583855`): ten by unregistration, each
 * with a tombstone docblock where it was registered, and the `metric` /
 * `metric-card` node keys through `skipFallback: true` (M3 option A — the
 * dashboard surfaces emit the namespaced keys; the widget vocabulary is
 * untouched).
 */
const UNREGISTERED_10859_BATCH_8_PHASE_2B = {
  'scatter-chart': 'plugin-charts:scatter-chart',
  'dashboard-grid': 'plugin-dashboard:dashboard-grid',
  'form-analytics': 'plugin-form:form-analytics',
  'import-wizard': 'plugin-grid:import-wizard',
  'shared-view-link': 'view:shared-view-link',
  'app-creation-wizard': 'plugin-designer:app-creation-wizard',
  'branding-editor': 'plugin-designer:branding-editor',
  'dashboard-editor': 'plugin-designer:dashboard-editor',
  'navigation-designer': 'plugin-designer:navigation-designer',
  'related-list': 'plugin-detail:related-list',
} as const;
const SKIP_FALLBACK_10859_BATCH_8_PHASE_2B = {
  metric: 'plugin-dashboard:metric',
  'metric-card': 'plugin-dashboard:metric-card',
} as const;
const RETIRED_BARE_KEYS_10859_BATCH_8_PHASE_2B = [
  ...Object.keys(UNREGISTERED_10859_BATCH_8_PHASE_2B),
  ...Object.keys(SKIP_FALLBACK_10859_BATCH_8_PHASE_2B),
];

/**
 * The four bare keys objectui#10859 batch 8 phase 2c RETIRED by unregistration
 * (the seat's fork ruling `5948252391`), each mapped to the namespaced twins
 * that went with it. `page-header` had two: `@object-ui/layout`'s registration
 * and the opt-in `PROTOCOL_COMPONENTS` placeholder in `@object-ui/components`.
 */
const UNREGISTERED_10859_BATCH_8_PHASE_2C = {
  'pie-chart': ['plugin-charts:pie-chart'],
  'donut-chart': ['plugin-charts:donut-chart'],
  'radar-chart': ['plugin-charts:radar-chart'],
  'page-header': ['layout:page-header', 'protocol-placeholder:page-header'],
} as const;

/**
 * The two bare keys objectui#11441 RETIRED by unregistration (the maintainer's
 * ruling `5950208338`, letters B / B, run as one more batch of this card), each
 * mapped to the namespaced twin that went with it. Both were
 * `@object-ui/layout` registrations; `NavigationRenderer` and `ResponsiveGrid`
 * stay exports.
 */
const UNREGISTERED_11441 = {
  'navigation-renderer': ['layout:navigation-renderer'],
  'responsive-grid': ['layout:responsive-grid'],
} as const;

/**
 * Every bare key still refused at `type` after objectui#11441 — the
 * `REFUSED_AT_TYPE` docblock says why each is still here. Alphabetical.
 */
const STILL_REFUSED_10859 = [
  'app-schema-renderer', 'detail-section', 'embeddable-form', 'home',
  'object-pivot', 'record',
  'sidebar-content', 'sidebar-footer', 'sidebar-group', 'sidebar-header',
  'sidebar-inset', 'sidebar-menu', 'sidebar-menu-button', 'sidebar-menu-item',
  'sidebar-provider', 'sidebar-trigger', 'spec-report', 'utility',
] as const;

/** Is `type` unclaimed by every arm of the validator's root union? */
function refusedAtType(type: string): boolean {
  const result = safeValidateSchema({ type });
  if (result.success) return false;
  return result.error.issues.some(
    (issue) => issue.code === 'invalid_union' && issue.path.length === 1 && issue.path[0] === 'type',
  );
}

describe('registered component types refused at `type` — a ratchet (objectui#10859)', () => {
  it('the refused count equals the pin, and only ever falls', () => {
    const refused = BARE_KEYS.filter(refusedAtType);
    expect(
      refused.length,
      [
        `\`objectui validate\` refuses ${refused.length} registered bare key(s) at \`type\`; the pin is ${REFUSED_AT_TYPE}.`,
        refused.length < REFUSED_AT_TYPE
          ? `Fewer than the pin — an arm landed. LOWER \`REFUSED_AT_TYPE\` to ${refused.length} in this same change (objectui#10859).`
          : 'MORE than the pin — a registered key lost its arm or a registration landed without one. '
            + 'Arm it in `@object-ui/types/zod` (or take its authorability to objectui#10859); ⛔ never raise the pin.',
        `Refused: ${refused.join(', ')}`,
      ].join('\n'),
    ).toBe(REFUSED_AT_TYPE);
  });

  it('reads the whole generated population, not a fragment of it (non-vacuity)', () => {
    // The card's measurement was over this same population; a filter that
    // matched nothing would make the count above trivially small. (The floor
    // was 200 until objectui#10859 batch 8 unregistered thirty bare keys.)
    expect(BARE_KEYS.length).toBeGreaterThan(150);
    expect(BARE_KEYS).toContain('timeline');
    expect(BARE_KEYS).toContain('ai-form-assist');
  });

  it('tells a claimed type from an unclaimed one — both instrument controls fire', () => {
    // Lit control: an armed, registered key is not refused at `type`.
    expect(refusedAtType('timeline')).toBe(false);
    // A key whose arm wants a required member fails, but NOT at `type`.
    expect(safeValidateSchema({ type: 'chart' }).success).toBe(false);
    expect(refusedAtType('chart')).toBe(false);
    // And a type no arm claims IS refused there.
    expect(refusedAtType('no-such-component-10859')).toBe(true);
  });

  it('counts the three plugin-ai keys as armed (objectui#10859 batch 1)', () => {
    for (const key of ['ai-form-assist', 'ai-recommendations', 'nl-query']) {
      expect(BARE_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts the three keys batch 2 armed (objectui#10859 batch 2)', () => {
    for (const key of ['pivot', 'object-metric', 'object-master-detail-form']) {
      expect(BARE_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts the key batch 3 armed (objectui#10859 batch 3)', () => {
    expect(BARE_KEYS).toContain('object-timeline');
    expect(refusedAtType('object-timeline')).toBe(false);
  });

  it('counts the six designer keys batch 7 armed (objectui#10859 batch 7)', () => {
    for (const key of [
      'page-designer', 'data-model-designer', 'process-designer',
      'report-designer', 'object-manager', 'field-designer',
    ]) {
      expect(BARE_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts the thirty keys batch 8 retired as gone from the registry (objectui#10859 batch 8)', () => {
    // Retired, not armed: each key left the generated population, so it can
    // neither be refused nor pass. Still refused at `type` — no arm was added.
    for (const key of RETIRED_BARE_KEYS_10859_BATCH_8) {
      expect(BARE_KEYS, key).not.toContain(key);
      expect(refusedAtType(key), key).toBe(true);
    }
    // The field widgets themselves stay registered, under `field:TYPE` only.
    for (const key of RETIRED_FIELD_FALLBACKS_10859_BATCH_8) {
      expect(NAMESPACED_KEYS, `field:${key}`).toContain(`field:${key}`);
    }
    // The aliases' namespaced twins went with them; the canonical blocks stay.
    expect(NAMESPACED_KEYS).not.toContain('view:tree');
    expect(NAMESPACED_KEYS).not.toContain('plugin-view:view');
    expect(BARE_KEYS).toContain('object-tree');
    expect(BARE_KEYS).toContain('object-view');
  });

  it('counts the twelve keys batch 8 phase 2b retired as gone from the registry (objectui#10859 batch 8)', () => {
    expect(RETIRED_BARE_KEYS_10859_BATCH_8_PHASE_2B).toHaveLength(12);
    // Retired, not armed: each bare key left the population and is still
    // refused at `type`, because no arm was added.
    for (const key of RETIRED_BARE_KEYS_10859_BATCH_8_PHASE_2B) {
      expect(BARE_KEYS, key).not.toContain(key);
      expect(refusedAtType(key), key).toBe(true);
    }
    // Unregistered: the namespaced twin went too.
    for (const twin of Object.values(UNREGISTERED_10859_BATCH_8_PHASE_2B)) {
      expect(NAMESPACED_KEYS, twin).not.toContain(twin);
    }
    // `skipFallback`: the namespaced key the dashboard surfaces emit stays.
    for (const kept of Object.values(SKIP_FALLBACK_10859_BATCH_8_PHASE_2B)) {
      expect(NAMESPACED_KEYS, kept).toContain(kept);
    }
    // Lit controls: the canonical spellings the retirements point authors to.
    expect(BARE_KEYS).toContain('chart');
    expect(BARE_KEYS).toContain('dashboard');
    expect(NAMESPACED_KEYS).toContain('record:related_list');
  });

  it('counts the four keys batch 8 phase 2c retired as gone from the registry (objectui#10859 batch 8)', () => {
    expect(Object.keys(UNREGISTERED_10859_BATCH_8_PHASE_2C)).toHaveLength(4);
    for (const [key, twins] of Object.entries(UNREGISTERED_10859_BATCH_8_PHASE_2C)) {
      // Retired, not armed: out of the population, still refused at `type`.
      expect(BARE_KEYS, key).not.toContain(key);
      expect(refusedAtType(key), key).toBe(true);
      for (const twin of twins) expect(NAMESPACED_KEYS, twin).not.toContain(twin);
    }
    // Lit controls: the spellings the retirements point authors to.
    expect(BARE_KEYS).toContain('chart');
    expect(refusedAtType('chart')).toBe(false);
    expect(NAMESPACED_KEYS).toContain('page:header');
    expect(refusedAtType('page:header')).toBe(false);
  });

  it('counts the two keys objectui#11441 retired as gone from the registry (objectui#10859)', () => {
    expect(Object.keys(UNREGISTERED_11441)).toHaveLength(2);
    for (const [key, twins] of Object.entries(UNREGISTERED_11441)) {
      // Retired, not armed: out of the population, still refused at `type`.
      expect(BARE_KEYS, key).not.toContain(key);
      expect(refusedAtType(key), key).toBe(true);
      for (const twin of twins) expect(NAMESPACED_KEYS, twin).not.toContain(twin);
    }
    // Lit controls: `grid`, the spelling the `responsive-grid` retirement
    // points authors to, is registered and claimed; `app-schema-renderer`, the
    // whole-shell door navigation goes through, stays registered (and refused,
    // until objectui#11440 arms it).
    expect(BARE_KEYS).toContain('grid');
    expect(refusedAtType('grid')).toBe(false);
    expect(BARE_KEYS).toContain('app-schema-renderer');
    expect(NAMESPACED_KEYS).toContain('layout:app-schema-renderer');
  });

  it('the refused set is exactly the named remainder — the pin comment cannot drift (objectui#10859 batch 8)', () => {
    const refused = BARE_KEYS.filter(refusedAtType).sort();
    expect(refused).toEqual([...STILL_REFUSED_10859]);
    expect(STILL_REFUSED_10859).toHaveLength(REFUSED_AT_TYPE);
  });
});

describe('registered NAMESPACED component types refused at `type` — a ratchet (objectui#10872)', () => {
  it('the refused count equals the pin, and only ever falls', () => {
    const refused = NAMESPACED_KEYS.filter(refusedAtType);
    expect(
      refused.length,
      [
        `\`objectui validate\` refuses ${refused.length} registered namespaced key(s) at \`type\`; the pin is ${NAMESPACED_REFUSED_AT_TYPE}.`,
        refused.length < NAMESPACED_REFUSED_AT_TYPE
          ? `Fewer than the pin — an arm landed. LOWER \`NAMESPACED_REFUSED_AT_TYPE\` to ${refused.length} in this same change (objectui#10872).`
          : 'MORE than the pin — a registered key lost its arm or a registration landed without one. '
            + 'Arm it in `@object-ui/types/zod` (or take its authorability to objectui#10872); ⛔ never raise the pin.',
        `Refused: ${refused.join(', ')}`,
      ].join('\n'),
    ).toBe(NAMESPACED_REFUSED_AT_TYPE);
  });

  it('reads the whole generated namespaced population (non-vacuity)', () => {
    expect(NAMESPACED_KEYS.length).toBeGreaterThan(400);
    // Lit control: the one namespaced key armed before objectui#10872.
    expect(NAMESPACED_KEYS).toContain('ui:calendar');
    expect(refusedAtType('ui:calendar')).toBe(false);
    // And a namespaced key no arm claims IS refused there.
    expect(refusedAtType('no-such-namespace:component-10872')).toBe(true);
  });

  it('counts the public blocks objectui#10872 batch 1 armed', () => {
    for (const key of ARMED_PUBLIC_BLOCKS_10872) {
      expect(NAMESPACED_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts the public block objectui#10872 batch 2 armed', () => {
    for (const key of ARMED_PUBLIC_BLOCKS_10872_BATCH_2) {
      expect(NAMESPACED_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts the six public blocks objectui#10872 batch 4 armed', () => {
    for (const key of ARMED_PUBLIC_BLOCKS_10872_BATCH_4) {
      expect(NAMESPACED_KEYS, key).toContain(key);
      expect(refusedAtType(key), key).toBe(false);
    }
  });

  it('counts `cloud:plan-status` armed — it registered WITH its arm (objectui#10919)', () => {
    // One registry key (`skipFallback: true`, so no bare `plan-status`), armed in
    // `@object-ui/types/zod` in the same change, so the pin above did not move.
    expect(NAMESPACED_KEYS).toContain('cloud:plan-status');
    expect(BARE_KEYS).not.toContain('plan-status');
    expect(refusedAtType('cloud:plan-status')).toBe(false);
  });
});

/* ── End to end: the README document through `objectui validate` ─────────── */

/** Rooted on this file, never on `process.cwd()`. */
const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_AI_README = join(HERE, '..', '..', '..', 'plugin-ai', 'README.md');
const QUICK_START = join(HERE, '..', '..', '..', '..', 'content', 'docs', 'guide', 'quick-start.md');

/** See `validate-root-path-line.test.ts` — the escape byte is never spelled. */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

let dir: string;
let out: string[];
let exitCodes: number[];
let restore: () => void;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'objectui-validate-10859-'));
  out = [];
  exitCodes = [];
  const originalLog = console.log;
  const originalError = console.error;
  const capture = (...args: unknown[]) => {
    out.push(args.map(String).join(' '));
  };
  console.log = capture;
  console.error = capture;
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    exitCodes.push(code ?? 0);
    return undefined as never;
  }) as never);
  restore = () => {
    console.log = originalLog;
    console.error = originalError;
    exitSpy.mockRestore();
  };
});

afterEach(() => {
  restore();
  rmSync(dir, { recursive: true, force: true });
});

describe('objectui validate — the plugin-ai README document (objectui#10859)', () => {
  it('validates the "Schema-Driven Usage" `ai-form-assist` document', async () => {
    const readme = readFileSync(PLUGIN_AI_README, 'utf8');
    const section = readme.slice(readme.indexOf('## Schema-Driven Usage'));
    const fence = /```json\n([\s\S]*?)\n```/.exec(section);
    expect(fence, 'no ```json fence under "## Schema-Driven Usage"').not.toBeNull();
    const file = join(dir, 'ai-form-assist.json');
    writeFileSync(file, (fence as RegExpExecArray)[1], 'utf-8');
    // Lit control on the extraction: it is the taught node.
    expect(JSON.parse((fence as RegExpExecArray)[1]).type).toBe('ai-form-assist');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).not.toContain('Schema validation failed');
    expect(text).toContain('Schema is valid');
    expect(exitCodes).toEqual([0]);
  });
});

/* ── End to end: a page of public blocks through `objectui validate` ─────── */

describe('objectui validate — a page built from ADR-0080 public blocks (objectui#10872)', () => {
  it('validates a page of `page:header`, `record:details` and `element:text`', async () => {
    // Each block in the spelling the platform's own producers write — the
    // spec's `{ type, properties }` bag (`buildDefaultPageSchema`'s
    // `componentNode`, the page designer) — with one bare node, which is the
    // synthesizer's shape for a block it configures nothing on.
    const page = {
      type: 'page',
      title: 'Account',
      children: [
        { type: 'page:header', properties: { title: 'Account', subtitle: 'Customer' } },
        { type: 'record:details' },
        { type: 'element:text', properties: { content: 'Recent activity' } },
      ],
    };
    const file = join(dir, 'public-blocks-page.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).not.toContain('Schema validation failed');
    expect(text).toContain('Schema is valid');
    expect(exitCodes).toEqual([0]);
  });

  it('still judges a public block\'s bag — an undeclared prop is refused and named', async () => {
    // The control that keeps the row above from passing for the wrong reason:
    // the same page with one invented prop on a nested block fails.
    const page = {
      type: 'page',
      children: [{ type: 'page:header', properties: { title: 'Account', inventedProp10872: true } }],
    };
    const file = join(dir, 'public-blocks-page-refused.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).toContain('Schema validation failed');
    expect(text).toContain('inventedProp10872');
    expect(exitCodes).toEqual([1]);
  });

  it('validates `element:number` in both of its binding forms (objectui#10872 batch 2)', async () => {
    // The props form, and the `dataSource` form the spec's props gate waives
    // `properties.object` for.
    const page = {
      type: 'page',
      children: [
        { type: 'element:number', properties: { object: 'order', aggregate: 'count' } },
        { type: 'element:number', dataSource: { object: 'order' }, properties: { aggregate: 'sum', field: 'total' } },
      ],
    };
    const file = join(dir, 'element-number-page.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).not.toContain('Schema validation failed');
    expect(text).toContain('Schema is valid');
    expect(exitCodes).toEqual([0]);
  });

  it('refuses an `element:number` that names its object nowhere, at `properties.object`', async () => {
    // The control that keeps the row above from passing for the wrong reason.
    const page = { type: 'page', children: [{ type: 'element:number', properties: { aggregate: 'count' } }] };
    const file = join(dir, 'element-number-page-refused.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).toContain('Schema validation failed');
    expect(text).toContain('dataSource.object');
    expect(exitCodes).toEqual([1]);
  });

  it('validates a page with the taught `action:button` node (objectui#10872 batch 4)', async () => {
    // The node the quick-start's "Add Actions" section teaches — the one
    // AGENTS.md #4 and the handler-key refusals' own remedy point at — read
    // from the page that teaches it, beside a `page:header`. Since
    // objectui#11183 the page writes it in the spec's spelling, the block's
    // props in `properties`, so this row passes on the strict face as well.
    const quickStart = readFileSync(QUICK_START, 'utf8');
    const fence = /```json\n([\s\S]*?)\n```/.exec(quickStart.slice(quickStart.indexOf('### Add Actions')));
    expect(fence, 'no ```json fence under "### Add Actions" in the quick-start').not.toBeNull();
    const taught = JSON.parse((fence as RegExpExecArray)[1]);
    // Lit control on the extraction: it is the taught node, in the bag spelling.
    expect(taught.type).toBe('action:button');
    expect(taught.properties?.actionType).toBe('url');
    expect(taught).not.toHaveProperty('actionType');
    const page = {
      type: 'page',
      title: 'Users',
      children: [{ type: 'page:header', properties: { title: 'Users' } }, taught],
    };
    const file = join(dir, 'action-button-page.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).not.toContain('Schema validation failed');
    expect(text).toContain('Schema is valid');
    expect(exitCodes).toEqual([0]);
  });

  it('validates a page of the six batch-4 blocks in the spec\'s `properties` spelling', async () => {
    const page = {
      type: 'page',
      children: [
        { type: 'action:button', properties: { label: 'Open details', actionType: 'url', target: '/users/ada' } },
        { type: 'action:icon', properties: { icon: 'pencil', label: 'Edit', actionType: 'url', target: '/users/ada/edit' } },
        { type: 'action:group', properties: { display: 'dropdown', actions: [{ name: 'archive', label: 'Archive' }] } },
        { type: 'action:menu', properties: { actions: [{ name: 'delete', label: 'Delete' }] } },
        { type: 'element:definition-list', properties: { columns: 2, items: [{ term: 'Owner', description: 'Ada' }] } },
        { type: 'element:repeater', properties: { object: 'task', fields: ['subject'], limit: 5 } },
      ],
    };
    const file = join(dir, 'held-blocks-page.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).not.toContain('Schema validation failed');
    expect(text).toContain('Schema is valid');
    expect(exitCodes).toEqual([0]);
  });

  it('still judges an `action:button` bag — an undeclared prop is refused and named (batch 4)', async () => {
    // The control that keeps the two rows above from passing for the wrong reason.
    const page = {
      type: 'page',
      children: [{ type: 'action:button', properties: { label: 'Go', inventedProp10872b4: true } }],
    };
    const file = join(dir, 'action-button-page-refused.json');
    writeFileSync(file, JSON.stringify(page, null, 2), 'utf-8');

    await validate(file);

    const text = out.join('\n').replace(ANSI, '');
    expect(text).toContain('Schema validation failed');
    expect(text).toContain('inventedProp10872b4');
    expect(exitCodes).toEqual([1]);
  });
});
