// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11660 — switching an approval node's SLA escalation OFF removes the
 * `escalation` block; it never writes the `{ enabled: false }` stub.
 *
 * The governing text is the spec's own: `ApprovalEscalationSchema.enabled` is
 * described as "the feature-level switch is whether the escalation block exists
 * at all", and the block's `timeoutHours` is required whatever `enabled` says.
 * Triage ruled the direction (comment 6000059097 on the card): turning
 * escalation off removes the block — no `enabled: false` stub, no
 * `timeoutHours` kept behind a disabled toggle — and the reading follows from
 * it: no block reads OFF, a block that omits `enabled` reads ON (the
 * objectui#6620 pin), a stored `enabled: false` reads OFF.
 *
 * Every case runs twice, once per DESCRIPTOR SOURCE, because the inspector
 * renders `serverFields ?? fieldsForNodeType(...)`:
 *
 *  - `offline` — the hand-written table in `flow-node-config.ts`;
 *  - `engine`  — `getApprovalNodeConfigJsonSchema()` from the installed
 *    `@objectstack/spec/automation`, fed as the approval node's published
 *    `configSchema`. That function is what objectstack's `plugin-approvals`
 *    hands its approval node descriptor as `configSchema` (`approval-node.ts`,
 *    read at objectstack `6afb1b55`), so this is the shape a live backend
 *    publishes, not a hand-written imitation of it. It labels the fields from
 *    the schema (`Escalation`, `Timeout Hours`, …), which is why the labels
 *    below are per source.
 *
 * Round-trips are judged by `ApprovalNodeConfigSchema` imported from the
 * `@objectstack/spec/automation` SUBPATH — `ApprovalEscalationSchema` is not on
 * the package root.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const stubs = vi.hoisted(() => ({ configSchemas: {} as Record<string, unknown> }));

vi.mock('../previews/useFlowNodePalette', () => ({
  useActionConfigSchemas: () => stubs.configSchemas,
  useFlowNodePalette: () => [],
}));
vi.mock('../previews/useObjectFields', () => ({
  useObjectFields: () => ({ fields: [], loading: false, error: null }),
}));

import { FlowNodeInspector } from './FlowNodeInspector';
import type { MetadataSelection } from '../preview-registry';
import { ApprovalNodeConfigSchema, getApprovalNodeConfigJsonSchema } from '@objectstack/spec/automation';

/* ── The `meta/*` double (objectui#7307), as the sibling inspector files
 * serve it: an empty registry in the `{ type, items: [] }` envelope, and an
 * `afterEach` that fails on any URL outside the metadata routes. ── */
const META_PREFIX = '/api/v1/meta/';
let calls: string[] = [];
const routeOf = (url: string) => url.split('?')[0];

beforeEach(() => {
  stubs.configSchemas = {};
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

const APPROVERS = [{ type: 'user', value: 'usr_approver' }];

function draftWith(config: Config): Draft {
  return { nodes: [{ id: 'gate', type: 'approval', label: 'Gate', config }], edges: [] };
}

const configOf = (draft: Draft): Config | undefined => draft.nodes[0].config as Config | undefined;

/**
 * The editor loop: every patch is applied to the draft the inspector renders
 * next, as the host does. `latest()` is the draft a save would send.
 */
function mount(initial: Draft) {
  let current = initial;
  const patches: unknown[] = [];
  function Host() {
    const [draft, setDraft] = React.useState<Draft>(initial);
    return (
      <FlowNodeInspector
        type="flow"
        name="renewal"
        draft={draft}
        selection={{ kind: 'node', id: 'gate' } as MetadataSelection}
        onPatch={(patch) => {
          patches.push(patch);
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
  const utils = render(<Host />);
  return { ...utils, patches, latest: () => current };
}

interface Labels {
  gate: string;
  timeout: string;
  action: string;
  escalateTo: string;
  notify: string;
  reassign: string;
}

const SOURCES: Array<{ name: 'offline' | 'engine'; labels: Labels; install: () => void }> = [
  {
    name: 'offline',
    labels: {
      gate: 'SLA escalation',
      timeout: 'Timeout (hours)',
      action: 'On timeout',
      escalateTo: 'Escalate to',
      notify: 'Notify submitter',
      reassign: 'Reassign',
    },
    install: () => {
      stubs.configSchemas = {};
    },
  },
  {
    name: 'engine',
    labels: {
      gate: 'Escalation',
      timeout: 'Timeout Hours',
      action: 'Action',
      escalateTo: 'Escalate To',
      notify: 'Notify Submitter',
      reassign: 'Reassign',
    },
    install: () => {
      stubs.configSchemas = { approval: getApprovalNodeConfigJsonSchema() };
    },
  },
];

const gateBox = (l: Labels) => screen.queryByLabelText(l.gate) as HTMLInputElement | null;
const subLabels = (l: Labels) => [l.timeout, l.action, l.escalateTo, l.notify];
const shownSubFields = (l: Labels) => subLabels(l).filter((label) => screen.queryByText(label) !== null);
const retainedNotices = () => screen.queryAllByTestId('inactive-retained');

/** The free-text input of the `Escalate to` reference field (no data adapter is mounted, so it is a plain input). */
function escalateToInput(l: Labels): HTMLInputElement {
  const label = screen.getByText(l.escalateTo);
  const input = label.parentElement?.querySelector('input');
  if (!input) throw new Error(`no input beside '${l.escalateTo}'`);
  return input as HTMLInputElement;
}

for (const source of SOURCES) {
  const l = source.labels;

  describe(`${source.name} descriptors: a node with no escalation block reads OFF (objectui#11660)`, () => {
    beforeEach(source.install);

    it('the toggle draws unchecked and no escalation field is revealed', () => {
      const draft = draftWith({ approvers: APPROVERS });
      const before = JSON.stringify(draft);
      const { patches } = mount(draft);
      const box = gateBox(l);
      expect(box, 'the switch is on screen').not.toBeNull();
      expect(box!.checked, 'no block is OFF — the spec calls the block itself the switch').toBe(false);
      expect(shownSubFields(l), 'none of the four escalation fields is revealed over no block').toEqual([]);
      // A read: rendering the corrected toggle writes nothing.
      expect(patches, 'rendering patches the draft zero times').toEqual([]);
      expect(JSON.stringify(draft), 'and the draft is unchanged byte for byte').toBe(before);
    });

    it('lit control: a block that omits `enabled` still reads ON and reveals its fields (objectui#6620)', () => {
      mount(draftWith({ approvers: APPROVERS, escalation: { timeoutHours: 24 } }));
      expect(gateBox(l)!.checked, 'inside a block, the spec default `true` applies').toBe(true);
      expect(shownSubFields(l)).toEqual(subLabels(l));
    });

    it('a stored `enabled: false` reads OFF', () => {
      mount(draftWith({ approvers: APPROVERS, escalation: { enabled: false } }));
      expect(gateBox(l)!.checked).toBe(false);
      expect(shownSubFields(l)).toEqual([]);
    });
  });

  describe(`${source.name} descriptors: switching escalation off removes the block (objectui#11660)`, () => {
    beforeEach(source.install);

    it('a block holding every value leaves no `escalation` key, and every sibling config key byte-identical', () => {
      const siblings: Config = {
        approvers: APPROVERS,
        behavior: 'quorum',
        minApprovals: 1,
        onEmptyApprovers: 'fail',
        lockRecord: false,
        maxRevisions: 2,
        // An Advanced (JSON) extra — a key no form field owns.
        custom_note: { kept: ['as', 'is'] },
      };
      const config: Config = {
        ...siblings,
        escalation: { enabled: true, timeoutHours: 24, action: 'reassign', escalateTo: 'sre_lead', notifySubmitter: false },
      };
      const { latest } = mount(draftWith(config));
      expect(gateBox(l)!.checked, 'premise: escalation is on').toBe(true);

      gateBox(l)!.click();

      const after = configOf(latest())!;
      expect('escalation' in after, 'no `escalation` key is left behind — not a stub, not a hidden block').toBe(false);
      // Byte-identical siblings, key order included: the removal deletes one key
      // and rebuilds nothing else.
      expect(JSON.stringify(after)).toBe(JSON.stringify(siblings));

      // What the author sees next: the switch off, nothing revealed, and nothing
      // flagged as retained — there is nothing left to retain.
      expect(gateBox(l)!.checked, 'the toggle reads the absent block as off').toBe(false);
      expect(shownSubFields(l)).toEqual([]);
      expect(retainedNotices()).toHaveLength(0);
    });

    it('a block that omits `enabled` (switch drawn on by default) is removed too', () => {
      const { latest } = mount(draftWith({ approvers: APPROVERS, escalation: { timeoutHours: 8 } }));
      gateBox(l)!.click();
      expect(configOf(latest())).toEqual({ approvers: APPROVERS });
    });

    it('an emptied `config` is pruned with the block', () => {
      const { latest } = mount(draftWith({ escalation: { enabled: true, timeoutHours: 24 } }));
      gateBox(l)!.click();
      expect(latest().nodes[0], 'removing the only config key leaves no empty `config` object').not.toHaveProperty('config');
    });
  });

  describe(`${source.name} descriptors: an inspector-authored node round-trips through ApprovalNodeConfigSchema (objectui#11660)`, () => {
    beforeEach(source.install);

    it('escalation ON with every value parses and keeps every value; OFF leaves no block and parses', async () => {
      const { latest } = mount(draftWith({ approvers: APPROVERS }));
      expect(gateBox(l)!.checked, 'premise: a fresh node starts off').toBe(false);

      // ON, authored control by control through the inspector.
      gateBox(l)!.click();
      expect(gateBox(l)!.checked, 'switching on draws the switch on').toBe(true);
      fireEvent.change(screen.getByLabelText(l.timeout), { target: { value: '24' } });
      await userEvent.click(screen.getByRole('combobox', { name: l.action }));
      await userEvent.click(await screen.findByRole('option', { name: l.reassign }));
      fireEvent.change(escalateToInput(l), { target: { value: 'sre_lead' } });
      (screen.getByLabelText(l.notify) as HTMLInputElement).click();

      const onConfig = configOf(latest())!;
      const authored = { enabled: true, timeoutHours: 24, action: 'reassign', escalateTo: 'sre_lead', notifySubmitter: false };
      expect(onConfig.escalation, 'the inspector stored exactly what the author entered').toEqual(authored);
      const on = ApprovalNodeConfigSchema.safeParse(onConfig);
      expect(on.success, on.success ? '' : JSON.stringify(on.error.issues)).toBe(true);
      expect((on.data as { escalation?: unknown }).escalation, 'and the contract keeps every value').toEqual(authored);

      // OFF.
      gateBox(l)!.click();
      const offConfig = configOf(latest())!;
      expect('escalation' in offConfig, 'switching off leaves no block').toBe(false);
      expect(offConfig).toEqual({ approvers: APPROVERS });
      const off = ApprovalNodeConfigSchema.safeParse(offConfig);
      expect(off.success, off.success ? '' : JSON.stringify(off.error.issues)).toBe(true);
      expect(off.data as Record<string, unknown>, 'the parsed node carries no escalation either').not.toHaveProperty('escalation');
    });
  });

  describe(`${source.name} descriptors: a stored switched-off block from older metadata (objectui#11660)`, () => {
    beforeEach(source.install);

    it('`{ enabled: false, timeoutHours: 24 }` reads OFF, shows the retained value, and writes nothing on render', () => {
      // A shape the spec ACCEPTS — the old inspector wrote it when an author
      // switched off a filled block. It is read, never rewritten on sight.
      expect(ApprovalNodeConfigSchema.safeParse({ approvers: APPROVERS, escalation: { enabled: false, timeoutHours: 24 } }).success).toBe(true);
      const draft = draftWith({ approvers: APPROVERS, escalation: { enabled: false, timeoutHours: 24 } });
      const before = JSON.stringify(draft);
      const { patches } = mount(draft);
      expect(gateBox(l)!.checked).toBe(false);
      expect(shownSubFields(l), 'the stored value is re-shown (objectui#6499)').toEqual([l.timeout]);
      expect(retainedNotices(), 'and flagged as kept, not in effect').toHaveLength(1);
      expect(patches).toEqual([]);
      expect(JSON.stringify(draft)).toBe(before);
    });

    it('clearing its last retained value leaves no `{ enabled: false }` stub behind', () => {
      const { latest } = mount(draftWith({ approvers: APPROVERS, escalation: { enabled: false, timeoutHours: 24 } }));
      fireEvent.click(within(retainedNotices()[0]).getByRole('button', { name: /clear value/i }));
      const after = configOf(latest())!;
      expect('escalation' in after, 'the bare stub the spec refuses is not written').toBe(false);
      expect(ApprovalNodeConfigSchema.safeParse(after).success).toBe(true);
    });

    it('clearing ONE of two retained values keeps the other — only the bare stub is removed', () => {
      // The boundary of the stub rule: it removes a block holding nothing but
      // the switch, never a value the author did not clear.
      const { latest } = mount(
        draftWith({ approvers: APPROVERS, escalation: { enabled: false, timeoutHours: 24, escalateTo: 'sre_lead' } }),
      );
      expect(retainedNotices(), 'premise: both stored values are retained').toHaveLength(2);
      fireEvent.change(escalateToInput(l), { target: { value: '' } });
      expect(configOf(latest())!.escalation).toEqual({ enabled: false, timeoutHours: 24 });
    });
  });
}
