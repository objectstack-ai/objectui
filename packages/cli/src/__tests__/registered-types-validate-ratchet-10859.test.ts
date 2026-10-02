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
 * minus the six `@object-ui/plugin-designer` keys). LOWER it when a batch arms
 * more keys; never raise it.
 */
const REFUSED_AT_TYPE = 66;

/**
 * The head's refused count over the NAMESPACED keys (objectui#10872 batch 1:
 * 418 on `main` before it, minus the twenty ADR-0080 public blocks armed from
 * their `@objectstack/spec` `ComponentPropsMap` rows; batch 2: minus
 * `element:number`, armed with the spec's `dataSource` waiver; batch 4: minus
 * the six blocks `@objectstack/spec` 17.5.0 gave a row). LOWER it when a batch
 * arms more keys; never raise it.
 */
const NAMESPACED_REFUSED_AT_TYPE = 391;

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
    // matched nothing would make the count above trivially small.
    expect(BARE_KEYS.length).toBeGreaterThan(200);
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
