/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `objectui check` refuses a `${…}` written into a closed text key its
 * component node never evaluates (objectui#4795, ruling item 2).
 *
 * The ruling (maintainer, 2026-08-31): reject `${…}` in `title` / `label` /
 * `value` / `description` on a component node whose
 * `expressionBindableTextKeysFor(type)` answer excludes that key, types with no
 * row included (`text.value`, `action:button.label`). Sub-rule (i): component
 * nodes only, and the page document root's own `title` is a page key.
 * Sub-rule (ii): a type no registered component answers to warns instead.
 *
 * Expected text is derived from the command's own formatters, fed from the
 * gate's real findings, rather than copied here as literals. What the
 * assertions hold by hand is the SUBJECT: which key, at which path, refused or
 * not, and the exit code.
 *
 * Fixtures live under `os.tmpdir()`, never in the repo tree: `check()` globs
 * every JSON file under the directory it is handed, so a fixture committed
 * inside this workspace would be scanned by the repo's own `pnpm check`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { EXPRESSION_BINDABLE_TEXT_KEYS, expressionBindableTextKeysFor } from '@objectstack/spec/ui';

import { check } from '../commands/check.js';
import { formatIssuePath } from '../utils/issue-path.js';
import { KNOWN_SCHEMA_TYPES, isKnownSchemaType } from '../utils/known-schema-types.js';
import {
  describeUnbindableTextExpression,
  findUnbindableTextExpressions,
  workingChannels,
} from '../utils/unbindable-text-expressions.js';

const EXPR = '${data.total}';

let cwd: string;
let lines: string[];
let exitCodes: number[];
let restoreLog: () => void;

/**
 * The CSI sequences chalk may add. The escape byte is built with
 * `String.fromCharCode` rather than spelled into the source, so this file holds
 * no raw control character.
 */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function plainLines(): string[] {
  return lines.map((l) => l.replace(ANSI, ''));
}

function refusalLines(): string[] {
  return plainLines().filter((l) => l.startsWith('x Unevaluated expression in '));
}

function warningLines(): string[] {
  return plainLines().filter((l) => l.startsWith('⚠️ Expression not judged in '));
}

/**
 * Write one fixture and run the command over it. Every fixture carries
 * `className`, a structural key, so recognition is never the variable a case
 * turns on.
 */
async function checkOne(document: Record<string, unknown>): Promise<void> {
  writeFileSync(join(cwd, 'schema.json'), JSON.stringify({ className: 'x', ...document }));
  await check(cwd);
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'objectui-check-4795-'));
  lines = [];
  exitCodes = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    exitCodes.push(code ?? 0);
    return undefined as never;
  }) as never);
  restoreLog = () => {
    console.log = original;
    exitSpy.mockRestore();
  };
});

afterEach(() => {
  restoreLog();
  rmSync(cwd, { recursive: true, force: true });
});

describe('objectui check refuses an expression on a text key the node never evaluates', () => {
  it.each([
    // The two no-row types the ruling names by hand.
    ['text', 'value'],
    ['action:button', 'label'],
    // A type WITH a row, on a key its row leaves out.
    ['card', 'label'],
    ['statistic', 'title'],
    // A namespaced spelling: the lookup is asked verbatim, and `ui:card` has no row.
    ['ui:card', 'title'],
  ])('refuses `%s.%s`, naming the key, the path and the working channels', async (type, key) => {
    // Preconditions, asserted rather than assumed.
    expect(isKnownSchemaType(type)).toBe(true);
    expect(expressionBindableTextKeysFor(type)).not.toContain(key);

    await checkOne({ type, [key]: EXPR });

    const [finding] = findUnbindableTextExpressions({ type, [key]: EXPR });
    expect(finding).toMatchObject({ severity: 'refusal', type, key, path: [key] });
    expect(refusalLines()).toEqual([
      `x Unevaluated expression in schema.json ${describeUnbindableTextExpression(finding)}`,
    ]);
    const refusal = refusalLines()[0];
    expect(refusal).toContain(`at ${formatIssuePath([key])}:`);
    expect(refusal).toContain('`' + key + '`');
    expect(refusal).toContain(`"${type}"`);
    expect(plainLines()).toContain(`   ${workingChannels(finding)}`);
    expect(workingChannels(finding)).toContain('`content`');
    expect(workingChannels(finding)).toContain('`properties.' + key + '`');
    // A refusal fails the run.
    expect(plainLines()).toContain('Found 1 errors');
    expect(exitCodes).toEqual([1]);
  });

  it('names the keys a type with a row does evaluate', async () => {
    await checkOne({ type: 'card', label: EXPR });
    const [finding] = findUnbindableTextExpressions({ type: 'card', label: EXPR });
    expect(finding.evaluatedKeys).toEqual(expressionBindableTextKeysFor('card'));
    for (const own of expressionBindableTextKeysFor('card')) {
      expect(refusalLines()[0]).toContain('`' + own + '`');
      expect(workingChannels(finding)).toContain('`' + own + '`');
    }
  });

  it('refuses an expression inside a surrounding string, as the evaluator interpolates it', async () => {
    await checkOne({ type: 'text', value: `Total: ${EXPR}` });
    expect(refusalLines()).toHaveLength(1);
    expect(exitCodes).toEqual([1]);
  });

  it('walks `children`, an array or a single node, and prints the path to the key', async () => {
    const document = {
      type: 'flex',
      children: [
        { type: 'text', content: 'fine' },
        { type: 'aspect-ratio', children: { type: 'text', value: EXPR } },
      ],
    };
    await checkOne(document);
    const findings = findUnbindableTextExpressions(document);
    expect(findings.map((f) => f.path)).toEqual([['children', 1, 'children', 'value']]);
    expect(refusalLines()).toHaveLength(1);
    expect(refusalLines()[0]).toContain(
      `at ${formatIssuePath(['children', 1, 'children', 'value'])}:`,
    );
    expect(exitCodes).toEqual([1]);
  });

  it('refuses every offending node in the file, not only the first', async () => {
    await checkOne({
      type: 'stack',
      children: [
        { type: 'text', value: EXPR },
        { type: 'action:button', label: EXPR },
      ],
    });
    expect(refusalLines()).toHaveLength(2);
    expect(plainLines()).toContain('Found 2 errors');
  });
});

describe('objectui check passes an expression on a key the node evaluates', () => {
  it.each([
    ['statistic', 'value'],
    ['statistic', 'label'],
    ['statistic', 'description'],
    ['card', 'title'],
    ['card', 'description'],
    ['button', 'label'],
  ])('passes `%s.%s`', async (type, key) => {
    // The precondition: the carriage map DOES carry this key.
    expect(expressionBindableTextKeysFor(type)).toContain(key);
    await checkOne({ type, [key]: EXPR });
    expect(refusalLines()).toEqual([]);
    expect(warningLines()).toEqual([]);
    expect(exitCodes).toEqual([]);
  });

  it.each([
    ['plain text', 'Revenue'],
    ['an unclosed opener', 'costs ${ nothing'],
    ['an empty template', 'empty ${} braces'],
  ])('passes %s, which the evaluator does not read as an expression', async (_label, value) => {
    await checkOne({ type: 'text', value });
    expect(refusalLines()).toEqual([]);
    expect(exitCodes).toEqual([]);
  });

  it('judges only the four closed keys: `content` and the `properties` bag are evaluated channels', async () => {
    await checkOne({ type: 'text', content: EXPR, properties: { value: EXPR } });
    expect(refusalLines()).toEqual([]);
    expect(exitCodes).toEqual([]);
  });
});

describe('sub-rule (i): component nodes only', () => {
  it('does not judge the page document root’s own `title`', async () => {
    // The control: `page` has no row, so the key WOULD be refused on a node.
    expect(expressionBindableTextKeysFor('page')).not.toContain('title');
    await checkOne({ type: 'page', title: EXPR });
    expect(refusalLines()).toEqual([]);
    expect(warningLines()).toEqual([]);
    expect(exitCodes).toEqual([]);
  });

  it('still walks the page document root’s `children`', async () => {
    await checkOne({ type: 'page', title: EXPR, children: [{ type: 'text', value: EXPR }] });
    expect(refusalLines()).toHaveLength(1);
    expect(refusalLines()[0]).toContain(`at ${formatIssuePath(['children', 0, 'value'])}:`);
  });

  it('does not refuse a form field definition’s `label`: `fields[]` entries are not component nodes', async () => {
    const field = { name: 'total', type: 'text', label: EXPR };
    await checkOne({ type: 'form', fields: [field] });
    expect(refusalLines()).toEqual([]);
    expect(exitCodes).toEqual([]);

    // The control: the SAME object is refused where it IS a component node,
    // so the pass above is decided by position, not by the object.
    lines = [];
    exitCodes = [];
    await checkOne({ type: 'form', fields: [field], children: [field] });
    expect(refusalLines()).toHaveLength(1);
    expect(refusalLines()[0]).toContain(`at ${formatIssuePath(['children', 0, 'label'])}:`);
    expect(exitCodes).toEqual([1]);
  });
});

describe('sub-rule (ii): a type no registered component answers to warns, never refuses', () => {
  it('warns on `stat-card`, and the run still passes', async () => {
    expect(isKnownSchemaType('stat-card')).toBe(false);
    const document = { type: 'grid', children: [{ type: 'stat-card', value: EXPR }] };
    await checkOne(document);

    const [finding] = findUnbindableTextExpressions(document);
    expect(finding).toMatchObject({ severity: 'warning', type: 'stat-card', key: 'value' });
    expect(refusalLines()).toEqual([]);
    expect(warningLines()).toEqual([
      `⚠️ Expression not judged in schema.json ${describeUnbindableTextExpression(finding)}`,
    ]);
    expect(exitCodes).toEqual([]);
  });

  it('refuses on a registered type in the same file as a warned one', async () => {
    await checkOne({
      type: 'grid',
      children: [
        { type: 'stat-card', value: EXPR },
        { type: 'text', value: EXPR },
      ],
    });
    expect(warningLines()).toHaveLength(1);
    expect(refusalLines()).toHaveLength(1);
    expect(exitCodes).toEqual([1]);
  });
});

describe('only recognised ObjectUI files are judged', () => {
  it('judges a file the validity arm admitted, with no structural key', async () => {
    const document = { type: 'statistic', label: 'Total', value: '1', title: EXPR };
    writeFileSync(join(cwd, 'leaf.json'), JSON.stringify(document));
    await check(cwd);
    expect(refusalLines()).toHaveLength(1);
  });

  it('does not judge a file no recogniser admitted', async () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'x', type: 'module', description: EXPR }));
    await check(cwd);
    expect(refusalLines()).toEqual([]);
    expect(exitCodes).toEqual([]);
  });
});

/**
 * The gate and `SchemaRenderer` ask the lookup the same question.
 *
 * Both call `expressionBindableTextKeysFor(type)`, but a lookup called with a
 * different type string answers a different question: a gate that stripped
 * `ui:` would grant `ui:card` the `card` row the runtime never applies, and
 * pass the very literal the user then sees. The runtime's half — the type is
 * passed VERBATIM — is pinned by the `@object-ui/react` suite
 * `SchemaRenderer.bindableTextKeys.test.tsx` ("a namespaced spelling is not
 * silently normalized"). This table pins the gate's half on every type this
 * build registers, against the same verbatim lookup.
 */
describe('the gate asks the lookup what SchemaRenderer asks, on every registered type', () => {
  /** The four keys the gate refuses on a component node of `type`. */
  const refusedByGate = (type: string): string[] => {
    const node: Record<string, unknown> = { type };
    for (const key of EXPRESSION_BINDABLE_TEXT_KEYS) node[key] = EXPR;
    // Under a parent's `children`, so every type — `page` included — is judged
    // as a component node; the page document root is sub-rule (i)'s, above.
    return findUnbindableTextExpressions({ type: 'div', children: [node] })
      .filter((finding) => finding.severity === 'refusal')
      .map((finding) => finding.key);
  };

  it('refuses exactly the keys the verbatim lookup excludes', () => {
    const disagreements = KNOWN_SCHEMA_TYPES.flatMap((type) => {
      const excluded = EXPRESSION_BINDABLE_TEXT_KEYS.filter(
        (key) => !expressionBindableTextKeysFor(type).includes(key),
      );
      const refused = refusedByGate(type);
      return JSON.stringify(refused) === JSON.stringify(excluded)
        ? []
        : [`${type}: lookup excludes [${excluded.join(', ')}], gate refused [${refused.join(', ')}]`];
    });
    expect(disagreements).toEqual([]);
  });

  it('gives a namespaced spelling no row, even where its bare name has one', () => {
    // The registered types a prefix-stripping gate would get wrong. Derived,
    // and asserted non-empty, so this case cannot pass by having no subject.
    const namespacedWithBareRow = KNOWN_SCHEMA_TYPES.filter((type) => {
      const bare = type.slice(type.lastIndexOf(':') + 1);
      return type.includes(':') && expressionBindableTextKeysFor(bare).length > 0;
    });
    expect(namespacedWithBareRow).toContain('ui:card');
    for (const type of namespacedWithBareRow) {
      expect(refusedByGate(type), type).toEqual([...EXPRESSION_BINDABLE_TEXT_KEYS]);
    }
  });
});
