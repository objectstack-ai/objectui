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
 * minus the three `@object-ui/plugin-ai` arms). LOWER it when a batch arms more
 * keys; never raise it.
 */
const REFUSED_AT_TYPE = 76;

/** The bare registry keys — the population the card measured. */
const BARE_KEYS = KNOWN_SCHEMA_TYPES.filter((key) => !key.includes(':'));

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
});

/* ── End to end: the README document through `objectui validate` ─────────── */

/** Rooted on this file, never on `process.cwd()`. */
const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_AI_README = join(HERE, '..', '..', '..', 'plugin-ai', 'README.md');

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
