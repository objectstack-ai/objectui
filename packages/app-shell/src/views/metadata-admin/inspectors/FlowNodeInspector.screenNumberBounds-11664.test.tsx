// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11664 — a number column inside an objectList config field edits and
 * commits a JSON number, so a screen field's `min` / `max` land in the shape
 * the screen contract declares.
 *
 * `ScreenFieldConfigSchema.min` / `.max` are `z.number()`. The screen node's
 * published `configSchema` declares the two item properties `type: 'number'`,
 * but `columnsFor` mapped every non-boolean, non-enum, non-reference item
 * property to a text cell, `toRows` read a stored number through `String(v)`
 * and `rowsToList` committed `v.trim()`. So authoring `Min` = 1 saved `'1'`,
 * and re-saving a code-authored row turned `min: 0` into `'0'` — and every run
 * then failed at the screen node with "expected number, received string".
 *
 * Triage's direction (comment 6007030030 on the card): a number kind for
 * `type: 'number'` / `'integer'` item properties, the mapping the top-level
 * fields already use; the cell renders a number input and commits a number; an
 * empty cell commits nothing; `toRows` / `rowsToList` keep a stored number a
 * number; ⛔ no coercion on save of other columns' strings. Its two pins are
 * the first two `it`s of the engine-source block below.
 *
 * DESCRIPTOR SOURCE. The inspector renders `serverFields ?? fieldsForNodeType`.
 * The pins run on the ENGINE source: {@link SCREEN_CONFIG_SCHEMA} is the screen
 * descriptor's `configSchema`, transcribed from objectstack
 * `packages/services/service-automation/src/builtin/screen-nodes.ts`
 * (`registerScreenNodes`, read at objectstack `faf8dce482`; that package is
 * not installed in this repo, so the shape is copied, not imported). It is
 * the shape a live backend publishes for `screen`, the one whose `fields`
 * items declare `min` / `max` as numbers. The offline hand-written table lists
 * no `min` / `max` column for a screen field, so it has no number cell to pin.
 *
 * Every saved shape is judged by `ScreenConfigSchema` from the installed
 * `@objectstack/spec/automation`, the contract the run refuses against.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';

const stubs = vi.hoisted(() => ({ configSchemas: {} as Record<string, unknown> }));

vi.mock('../previews/useFlowNodePalette', () => ({
  useActionConfigSchemas: () => stubs.configSchemas,
  useFlowNodePalette: () => [],
}));
vi.mock('../previews/useObjectFields', () => ({
  useObjectFields: () => ({ fields: [], loading: false, error: null }),
}));

import { FlowNodeInspector } from './FlowNodeInspector';
import { jsonSchemaToFlowFields } from './json-schema-to-fields';
import type { MetadataSelection } from '../preview-registry';
import { ScreenConfigSchema } from '@objectstack/spec/automation';

/** The `screen` descriptor's `configSchema` — see the file header for where it is read from. */
const SCREEN_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', title: 'Title', description: 'Heading shown above the screen.' },
    description: { type: 'string', format: 'multiline', title: 'Description', description: 'Body text. Interpolates {var} references (e.g. {approval_path}).' },
    fields: {
      type: 'array',
      title: 'Fields',
      description: 'Input fields collected on this screen. Leave empty for a message-only screen.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          label: { type: 'string', title: 'Label' },
          type: { type: 'string', title: 'Type' },
          required: { type: 'boolean', title: 'Required' },
          options: {
            type: 'array',
            title: 'Options',
            description: 'Choices for a select-style field.',
            items: {
              type: 'object',
              properties: {
                value: { title: 'Value', description: 'Stored value.' },
                label: { type: 'string', title: 'Label' },
              },
            },
          },
          defaultValue: { title: 'Default', description: 'Prefilled value. Interpolates {var} references.' },
          placeholder: { type: 'string', title: 'Placeholder' },
          min: { type: 'number', title: 'Min', description: 'Minimum accepted value (numeric fields). Enforced when the run resumes.' },
          max: { type: 'number', title: 'Max', description: 'Maximum accepted value (numeric fields). Enforced when the run resumes.' },
          inlineHelpText: { type: 'string', title: 'Help text', description: 'Help text shown under the input. Unlike the placeholder, it stays readable once the user types.' },
          reference: {
            type: 'string',
            title: 'Lookup object',
            xRef: { kind: 'object' },
            description: 'Object whose records a `lookup` field picks from. Required on a `lookup` field — a picker with no target object resolves nothing.',
          },
          visibleWhen: { type: 'string', title: 'Visible when', xExpression: 'expression' },
        },
      },
    },
    waitForInput: { type: 'boolean', title: 'Wait for input', description: 'Pause to show this screen even with no fields (a message / confirmation). A field-less screen with this off is a server pass-through.' },
    objectName: { type: 'string', title: 'Object form', xRef: { kind: 'object' }, description: 'Render this object’s full create/edit form (incl. master-detail) instead of a flat field list.' },
    idVariable: { type: 'string', title: 'Saved-record variable', description: 'Object form only: variable bound to the saved record’s id, for later steps.' },
    mode: { type: 'string', enum: ['create', 'edit'], default: 'create', title: 'Form mode', description: 'Object form only.' },
    recordId: { type: 'string', title: 'Record to edit', description: 'Object form only: id of the record `edit` mode opens. Interpolates {var} references.' },
    defaults: { type: 'object', additionalProperties: true, title: 'Form defaults', description: 'Object form only: prefilled values (e.g. account → {account_id}).' },
  },
};

/* ── The `meta/*` double (objectui#7307), as the sibling inspector files serve
 * it: an empty registry in the `{ type, items: [] }` envelope, and an
 * `afterEach` that fails on any URL outside the metadata routes. ── */
const META_PREFIX = '/api/v1/meta/';
let calls: string[] = [];
const routeOf = (url: string) => url.split('?')[0];

beforeEach(() => {
  stubs.configSchemas = { screen: SCREEN_CONFIG_SCHEMA };
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(
        input && typeof input === 'object' && 'url' in input ? (input as { url: unknown }).url : input,
      );
      calls.push(url);
      const route = routeOf(url);
      if (!route.startsWith(META_PREFIX)) {
        return { ok: false, status: 404, headers: new Headers(), json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ type: route.slice(META_PREFIX.length), items: [] }),
      };
    }),
  );
});

afterEach(() => {
  expect(calls.filter((url) => !routeOf(url).startsWith(META_PREFIX))).toEqual([]);
  cleanup();
  vi.unstubAllGlobals();
});

type Config = Record<string, unknown>;
type Draft = { nodes: Array<Record<string, unknown>>; edges: unknown[] };
type ScreenField = Record<string, unknown>;

function draftWith(fields: ScreenField[]): Draft {
  return { nodes: [{ id: 'ask', type: 'screen', label: 'Ask', config: { fields } }], edges: [] };
}

const fieldsOf = (draft: Draft): ScreenField[] =>
  ((draft.nodes[0].config as Config | undefined)?.fields ?? []) as ScreenField[];

/** The editor loop: every patch lands on the draft the inspector renders next. */
function mount(initial: Draft) {
  let current = initial;
  function Host() {
    const [draft, setDraft] = React.useState<Draft>(initial);
    return (
      <FlowNodeInspector
        type="flow"
        name="intake"
        draft={draft}
        selection={{ kind: 'node', id: 'ask' } as MetadataSelection}
        onPatch={(patch) => {
          setDraft((d) => {
            current = { ...d, ...(patch as Partial<Draft>) };
            return current;
          });
        }}
        onClearSelection={vi.fn()}
        readOnly={false}
        locale="en-US"
      />
    );
  }
  render(<Host />);
  return { latest: () => current };
}

/**
 * The input of row `row`'s cell labelled `label` inside the `Fields` list (a
 * column label renders once per row; the node's own `Label` sits outside it).
 */
function cell(label: string, row = 0): HTMLInputElement {
  const list = screen.getByText('Fields', { selector: 'label' }).parentElement!;
  const labels = within(list).getAllByText(label, { selector: 'label' });
  const input = labels[row]?.parentElement?.querySelector('input');
  if (!input) throw new Error(`no '${label}' cell in row ${row}`);
  return input as HTMLInputElement;
}

/** Type a value and leave the cell — the cell flushes on blur, as the text cell does. */
function enter(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

/** `ScreenConfigSchema`'s verdict on a saved `fields` list, as `[code, path]` pairs. */
function refusals(fields: ScreenField[]): Array<[string, string]> {
  const parsed = ScreenConfigSchema.safeParse({ fields });
  return parsed.success ? [] : parsed.error.issues.map((i) => [i.code, i.path.join('.')]);
}

describe('the screen descriptor maps fields[].min / .max to number columns (objectui#11664)', () => {
  it('a `number` item property is a `number` column; strings, booleans and references keep their kinds', () => {
    const columns = jsonSchemaToFlowFields(SCREEN_CONFIG_SCHEMA)!.find((f) => f.id === 'fields')!.columns!;
    const kinds = Object.fromEntries(columns.map((c) => [c.key, c.kind]));
    expect(kinds.min).toBe('number');
    expect(kinds.max).toBe('number');
    expect(kinds).toMatchObject({
      name: 'text',
      label: 'text',
      type: 'text',
      placeholder: 'text',
      inlineHelpText: 'text',
      required: 'boolean',
      reference: 'reference',
      visibleWhen: 'expression',
      options: 'objectList',
    });
  });

  it('an `integer` item property maps the same way, and an enum still wins (→ select), as at the top level', () => {
    const columns = jsonSchemaToFlowFields({
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              ratio: { type: ['number', 'null'] },
              tier: { type: 'number', enum: [1, 2] },
            },
          },
        },
      },
    })!.find((f) => f.id === 'rows')!.columns!;
    const kinds = Object.fromEntries(columns.map((c) => [c.key, c.kind]));
    expect(kinds).toEqual({ count: 'number', ratio: 'number', tier: 'select' });
  });
});

describe('engine descriptors: a screen field’s Min / Max commit numbers (objectui#11664, triage 6007030030)', () => {
  it('pin 1: Min 1 / Max 10 authored in the inspector save as numbers the screen contract accepts', () => {
    const { latest } = mount(draftWith([{ name: 'qty', type: 'number' }]));
    expect(cell('Min').type, 'the Min cell is a number input').toBe('number');
    expect(cell('Max').type).toBe('number');

    enter(cell('Min'), '1');
    enter(cell('Max'), '10');

    const fields = fieldsOf(latest());
    expect(fields).toEqual([{ name: 'qty', type: 'number', min: 1, max: 10 }]);
    expect(typeof fields[0].min, 'min is a JSON number, not the string a text cell saved').toBe('number');
    expect(typeof fields[0].max).toBe('number');
    expect(refusals(fields), 'ScreenConfigSchema accepts the saved fields list').toEqual([]);
  });

  it('pin 2: re-saving a code-authored screen with `min: 0` keeps `0` — and a text column’s string stays a string', () => {
    const { latest } = mount(
      draftWith([
        { name: 'qty', label: 'Qty', type: 'number', min: 0, max: 5 },
        // A numeric-looking string in a TEXT column: ⛔ no coercion of other columns' strings.
        { name: 'note', label: '10', type: 'text' },
      ]),
    );
    expect(cell('Min').value, 'the number cell shows the stored 0').toBe('0');

    enter(cell('Label'), 'Quantity');

    const fields = fieldsOf(latest());
    expect(fields[0]).toEqual({ name: 'qty', label: 'Quantity', type: 'number', min: 0, max: 5 });
    expect(typeof fields[0].min, 'the untouched 0 is still a number').toBe('number');
    expect(fields[1], 'the other row is untouched').toEqual({ name: 'note', label: '10', type: 'text' });
    expect(typeof fields[1].label).toBe('string');
    expect(refusals(fields)).toEqual([]);
  });

  it('a typed `0` commits `0`, not "0" and not an absent key', () => {
    const { latest } = mount(draftWith([{ name: 'qty', type: 'number', max: 5 }]));

    enter(cell('Min'), '0');

    const [field] = fieldsOf(latest());
    expect(field).toEqual({ name: 'qty', type: 'number', min: 0, max: 5 });
    expect(Object.is(field.min, 0)).toBe(true);
  });

  it('emptying a number cell commits nothing: the key is absent, not "", null or NaN', () => {
    const { latest } = mount(draftWith([{ name: 'qty', type: 'number', min: 1, max: 10 }]));

    enter(cell('Max'), '');

    const [field] = fieldsOf(latest());
    expect(field).toEqual({ name: 'qty', type: 'number', min: 1 });
    expect(Object.prototype.hasOwnProperty.call(field, 'max'), 'no `max` key at all').toBe(false);
    expect(refusals([field])).toEqual([]);
  });

  // A browser's number input reports `''` for an entry it cannot read as a
  // number, so such an entry commits nothing, exactly as the top-level number
  // field does. Two spellings: `ten` the DOM itself blanks, and `1e`, a partial
  // exponent this test DOM hands through as typed — the one that reaches the
  // cell's own parse.
  it.each(['ten', '1e'])('a non-numeric entry (%s) is never committed as a string', (typed) => {
    const { latest } = mount(draftWith([{ name: 'qty', type: 'number', min: 1, max: 10 }]));

    enter(cell('Max'), typed);

    const [field] = fieldsOf(latest());
    expect(field).toEqual({ name: 'qty', type: 'number', min: 1 });
    expect(refusals([field])).toEqual([]);
  });

  it('a string stored in a number column is kept verbatim on re-save, ⛔ not coerced — the contract still refuses it', () => {
    // What the text cell used to save. The designer keeps stored data as it
    // is; the refusal stays where the contract puts it.
    const { latest } = mount(draftWith([{ name: 'qty', label: 'Qty', type: 'number', min: '1', max: 10 }]));
    expect(cell('Min').value, 'the cell shows the stored string the browser can read as a number').toBe('1');

    enter(cell('Label'), 'Quantity');

    const [field] = fieldsOf(latest());
    expect(field).toEqual({ name: 'qty', label: 'Quantity', type: 'number', min: '1', max: 10 });
    expect(refusals([field])).toEqual([['invalid_type', 'fields.0.min']]);

    // Typing over it replaces the string with a number.
    enter(cell('Min'), '2');
    const [retyped] = fieldsOf(latest());
    expect(retyped.min).toBe(2);
    expect(refusals([retyped])).toEqual([]);
  });
});
