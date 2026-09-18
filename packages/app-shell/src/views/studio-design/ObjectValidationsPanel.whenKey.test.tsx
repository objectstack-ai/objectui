/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `whenKeyPin` — the Validations panel emits metadata the SPEC accepts.
 *
 * The panel's own docblock promises its skeletons "never 422". That was a claim
 * about a foreign schema with no instrument behind it, and it was false for the
 * whole life of the `conditional` type: the skeleton and the shared CEL editor
 * both spelled that rule's guard `condition`, which `ConditionalValidationSchema`
 * refuses BY NAME in favour of `when` (objectui#9802).
 *
 * ⇒ this pin does not assert source text or restate the panel's own spelling —
 * that is how the defect survived, since every existing assertion matched the
 * producer's output against the producer's own idea of the key. It takes what
 * the panel actually emits through `onPatch` and runs it through the spec's own
 * `ValidationRuleSchema` and `ObjectSchema` — the same parse the object-draft
 * save applies. A skeleton that would 422 fails here.
 *
 * The guard's key is per rule type and BOTH spellings are live: `script` and
 * `cross_field` carry `condition`, `conditional` carries `when`, and each shape
 * refuses the other's key. A blanket rename in either direction re-breaks the
 * other type, so the type-switch carry is pinned in both directions too.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ValidationRuleSchema, ObjectSchema } from '@objectstack/spec/data';

import { ObjectValidationsPanel } from './ObjectValidationsPanel';

afterEach(() => cleanup());

/** Menu labels, verbatim from the `engine.studio.rules.type*` English pack. */
const MENU: ReadonlyArray<[type: string, label: string]> = [
  ['script', 'Script — CEL fail condition'],
  ['cross_field', 'Cross-field — CEL over multiple fields'],
  ['state_machine', 'State machine — allowed transitions'],
  ['format', 'Format — regex / built-in format'],
  ['json_schema', 'JSON schema — validate a JSON field'],
  ['conditional', 'Conditional — apply a rule when a guard holds'],
];

const baseDraft = {
  name: 'invoice',
  label: 'Invoice',
  fields: {
    name: { type: 'text', label: 'Name' },
    amount: { type: 'number', label: 'Amount' },
  },
  validations: [
    { type: 'script', name: 'no_negative', message: 'no', condition: 'record.amount < 0', severity: 'error' },
  ],
};

/** Readable failure text: the spec's own issues, not a bare `false`. */
function issuesOf(result: { success: boolean; error?: { issues: Array<Record<string, unknown>> } }): string {
  if (result.success) return '(accepted)';
  return (result.error?.issues ?? [])
    .map((i) => `${String(i.code)}@${JSON.stringify(i.path)}${i.keys ? ' keys=' + JSON.stringify(i.keys) : ''}: ${String(i.message)}`)
    .join(' | ');
}

/** Run a rule through BOTH the union and the whole-object draft-save parse. */
function expectSpecAccepts(rule: unknown, what: string) {
  const asRule = ValidationRuleSchema.safeParse(rule);
  expect(`${what} :: ValidationRuleSchema :: ${issuesOf(asRule)}`).toBe(`${what} :: ValidationRuleSchema :: (accepted)`);
  const asDraft = ObjectSchema.safeParse({ ...baseDraft, validations: [rule] });
  expect(`${what} :: ObjectSchema :: ${issuesOf(asDraft)}`).toBe(`${what} :: ObjectSchema :: (accepted)`);
}

/** Add `label` from the New menu and return the rule the panel emitted. */
function addFromMenu(label: string): Record<string, unknown> {
  const onPatch = vi.fn();
  render(<ObjectValidationsPanel draft={baseDraft} onPatch={onPatch} />);
  fireEvent.click(screen.getByText('New'));
  fireEvent.click(screen.getByRole('button', { name: label }));
  const patch = onPatch.mock.calls[0][0];
  return patch.validations[patch.validations.length - 1];
}

describe('whenKeyPin — ObjectValidationsPanel emits spec-parseable metadata', () => {
  // The class, not just the instance: every type the New menu offers.
  it.each(MENU)('the %s skeleton parses through the spec the draft save uses', (type, label) => {
    const added = addFromMenu(label);
    expect(added.type).toBe(type);
    expectSpecAccepts(added, `${type} skeleton`);
  });

  it('seeds the conditional guard under `when` — the key the spec accepts', () => {
    const added = addFromMenu('Conditional — apply a rule when a guard holds');
    expect(added.when).toBe('false');
    expect(added).not.toHaveProperty('condition');
    // …and the nested `then` is a `script` rule, so ITS guard stays `condition`.
    expect(added.then).toMatchObject({ type: 'script', condition: 'false' });
  });

  it('the spec refuses the key this panel used to write — so the pin above has teeth', () => {
    const added = addFromMenu('Conditional — apply a rule when a guard holds');
    // Exactly the shape the panel emitted before objectui#9802, rebuilt here by
    // moving the guard back to the old key. Same parser, one key changed.
    const { when, ...rest } = added as { when?: unknown };
    const oldShape = { ...rest, condition: when };
    const refused = ValidationRuleSchema.safeParse(oldShape);
    expect(refused.success).toBe(false);
    expect(issuesOf(refused)).toMatch(/unrecognized_keys.*condition/);
  });

  it('reads a saved conditional rule\'s guard from `when`', () => {
    const guard = 'has(record.amount) && record.amount > 100';
    const draft = {
      ...baseDraft,
      validations: [
        {
          type: 'conditional',
          name: 'big_invoice',
          message: 'too big',
          severity: 'error',
          when: guard,
          then: { type: 'script', name: 'big_invoice_then', message: '', condition: 'false', severity: 'error' },
        },
      ],
    };
    render(<ObjectValidationsPanel draft={draft} onPatch={() => {}} />);
    // Read through the WRONG key and this renders empty — the editor showed a
    // blank guard for every conditional rule a spec-valid producer had written.
    expect(screen.getByDisplayValue(guard)).toBeInTheDocument();
  });

  it('writes an edited conditional guard back to `when`, and the result still parses', () => {
    const guard = 'has(record.amount) && record.amount > 100';
    const next = 'has(record.amount) && record.amount > 500';
    const rule = {
      type: 'conditional',
      name: 'big_invoice',
      message: 'too big',
      severity: 'error',
      when: guard,
      then: { type: 'script', name: 'big_invoice_then', message: '', condition: 'false', severity: 'error' },
    };
    const onPatch = vi.fn();
    render(<ObjectValidationsPanel draft={{ ...baseDraft, validations: [rule] }} onPatch={onPatch} />);
    fireEvent.change(screen.getByDisplayValue(guard), { target: { value: next } });
    const patch = onPatch.mock.calls[onPatch.mock.calls.length - 1][0];
    const written = patch.validations[0];
    expect(written.when).toBe(next);
    expect(written).not.toHaveProperty('condition');
    expectSpecAccepts(written, 'edited conditional');
  });

  it('carries the guard across a type switch in each side\'s own spelling', () => {
    // script (`condition`) → conditional (`when`)
    const onPatch = vi.fn();
    render(<ObjectValidationsPanel draft={baseDraft} onPatch={onPatch} />);
    fireEvent.change(screen.getByDisplayValue('Script — CEL fail condition'), {
      target: { value: 'conditional' },
    });
    const toConditional = onPatch.mock.calls[0][0].validations[0];
    expect(toConditional.when).toBe('record.amount < 0');
    expect(toConditional).not.toHaveProperty('condition');
    expectSpecAccepts(toConditional, 'script → conditional');
    cleanup();

    // conditional (`when`) → script (`condition`) — the same carry, reversed.
    const onPatch2 = vi.fn();
    const conditionalDraft = {
      ...baseDraft,
      validations: [
        {
          type: 'conditional',
          name: 'big_invoice',
          message: 'too big',
          severity: 'error',
          when: 'record.amount > 100',
          then: { type: 'script', name: 'big_invoice_then', message: '', condition: 'false', severity: 'error' },
        },
      ],
    };
    render(<ObjectValidationsPanel draft={conditionalDraft} onPatch={onPatch2} />);
    fireEvent.change(screen.getByDisplayValue('Conditional — apply a rule when a guard holds'), {
      target: { value: 'script' },
    });
    const toScript = onPatch2.mock.calls[0][0].validations[0];
    expect(toScript.condition).toBe('record.amount > 100');
    expect(toScript).not.toHaveProperty('when');
    expectSpecAccepts(toScript, 'conditional → script');
  });
});
