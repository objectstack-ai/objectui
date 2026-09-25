// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * flow-value-envelope (objectui#7588): which config map is a `value`-role slot,
 * how an expression cell writes its envelope, and the spec's refusal of a
 * malformed one. Every expectation about the envelope is read from
 * `@objectstack/spec/automation`, the same module the helpers import.
 */

import { describe, it, expect } from 'vitest';
import { ASSIGNMENT_VALUE_ENVELOPE_REFUSAL, FLOW_NODE_EXPRESSION_PATHS } from '@objectstack/spec/automation';
import {
  isEditableValueEnvelope,
  isValueEnvelopeSlot,
  valueEnvelopeRefusal,
  writeValueEnvelope,
} from './flow-value-envelope';
import { FLOW_NODE_TYPE_OPTIONS, fieldsForNodeType } from './flow-node-config';

describe('isValueEnvelopeSlot — read off the spec expression ledger (objectui#7588)', () => {
  it('answers true for the assignment node’s `assignments` map', () => {
    expect(isValueEnvelopeSlot('assignment', ['config', 'assignments'])).toBe(true);
  });

  it('answers false for another key, another node type, a non-config block, or no type', () => {
    expect(isValueEnvelopeSlot('assignment', ['config', 'other'])).toBe(false);
    expect(isValueEnvelopeSlot('create_record', ['config', 'assignments'])).toBe(false);
    expect(isValueEnvelopeSlot('assignment', ['connectorConfig', 'assignments'])).toBe(false);
    expect(isValueEnvelopeSlot(undefined, ['config', 'assignments'])).toBe(false);
  });

  it('offers the envelope on exactly one hand-table key/value map: assignment.assignments', () => {
    // The key/value editor serves many maps (params, headers, filters, inputs)
    // where an object naming a `dialect` is plain data. Every keyValue field in
    // the designer table is enumerated here. If the ledger declares another
    // `value`-role map, this goes red, and whoever widens it has to confirm
    // that `AssignmentValueSchema` is the right refusal for the new slot.
    const keyValueFields = FLOW_NODE_TYPE_OPTIONS.flatMap((type) =>
      fieldsForNodeType(type)
        .filter((f) => f.kind === 'keyValue')
        .map((f) => ({ type, path: f.path })),
    );
    expect(keyValueFields.length).toBeGreaterThan(1);
    const offered = keyValueFields
      .filter(({ type, path }) => isValueEnvelopeSlot(type, path))
      .map(({ type, path }) => `${type}:${path.join('.')}`);
    expect(offered).toEqual(['assignment:config.assignments']);
    // The same answer the ledger gives: one value-role entry, on that map.
    expect(FLOW_NODE_EXPRESSION_PATHS.filter((e) => e.role === 'value').map((e) => `${e.nodeType}:${e.path}`)).toEqual([
      'assignment:assignments.*',
    ]);
  });
});

describe('writeValueEnvelope — the objectui#3218 write table, applied to a value envelope', () => {
  it('writes a fresh envelope in the slot’s dialect when there is no prior one', () => {
    const out = writeValueEnvelope(undefined, 'amount * 2');
    expect(out).toEqual({ dialect: 'cel', source: 'amount * 2' });
    expect(isEditableValueEnvelope(out)).toBe(true);
    // A plain string prior is `{token}` text, not an envelope to preserve.
    expect(writeValueEnvelope('{amount}', 'amount')).toEqual({ dialect: 'cel', source: 'amount' });
  });

  it('keeps `meta`, drops the stale `ast`, and replaces `source` on an edit', () => {
    const prior = { dialect: 'cel', source: 'a', ast: { k: 1 }, meta: { rationale: 'why' } };
    expect(writeValueEnvelope(prior, 'b')).toEqual({ dialect: 'cel', source: 'b', meta: { rationale: 'why' } });
    expect(prior.ast).toEqual({ k: 1 });
  });

  it('hands the prior envelope back unchanged when `source` is not edited', () => {
    const prior = { dialect: 'cel', source: 'a', ast: { k: 1 } };
    expect(writeValueEnvelope(prior, 'a')).toBe(prior);
  });
});

describe('valueEnvelopeRefusal — the spec’s AssignmentValueSchema verdict', () => {
  it('accepts a `{token}` string, a literal, and a CEL envelope reaching the stdlib', () => {
    expect(valueEnvelopeRefusal('{record.name}')).toBeNull();
    expect(valueEnvelopeRefusal(30)).toBeNull();
    expect(valueEnvelopeRefusal({ $ne: null })).toBeNull();
    expect(valueEnvelopeRefusal({ dialect: 'cel', source: 'joinNonEmpty(names, ", ")' })).toBeNull();
  });

  it('refuses a malformed envelope with messages that lead with ASSIGNMENT_VALUE_ENVELOPE_REFUSAL', () => {
    for (const malformed of [
      { dialect: 'cel' },
      { dialect: 'cel', source: '   ' },
      { dialect: 'template', source: 'Hello {name}' },
      { dialect: 'cel', ast: {} },
    ]) {
      const refusal = valueEnvelopeRefusal(malformed);
      expect(refusal, JSON.stringify(malformed)).not.toBeNull();
      for (const message of refusal ?? []) expect(message.startsWith(ASSIGNMENT_VALUE_ENVELOPE_REFUSAL)).toBe(true);
    }
  });

  it('reads only a string `source` in the slot’s dialect as editable source text', () => {
    expect(isEditableValueEnvelope({ dialect: 'cel', source: '' })).toBe(true);
    expect(isEditableValueEnvelope({ dialect: 'template', source: 'x' })).toBe(false);
    expect(isEditableValueEnvelope({ dialect: 'cel' })).toBe(false);
    expect(isEditableValueEnvelope('{x}')).toBe(false);
  });
});
