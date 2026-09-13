// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#6830 — what a declared `FlowConfigField.defaultValue` actually does
 * to the RENDERED flow-node inspector.
 *
 * This file pins BEHAVIOUR, not source text. The card's claim ("ten fields
 * declare a default, the control shows none of them") is a claim about a
 * document, so it is settled by reading the document: every case below renders
 * `FlowNodeInspector` and interrogates the control the author actually sees —
 * the checkbox's `checked`, the select trigger's text. A pin written over the
 * declaration table would be a source-text snapshot and would pass on a build
 * where nothing rendered at all.
 *
 * ⚑ objectui#8451 rewrote the BOOLEAN half of this file; this revision rewrites
 * the SELECT half, and arm A is complete. Triage ruled arm A ("show, do not
 * write") on objectui#6830: the boolean control seeds its checked state from
 * the declared default, and a select control now states that default as its
 * trigger PLACEHOLDER. Both halves' defect rows were turned green against the
 * repaired behaviour rather than deleted — the rows PR #8431's ablation leg B
 * predicted would move. Everything else is carried over unchanged.
 *
 * The measurement, in four parts:
 *
 *  1. A declared default now reaches BOTH control kinds, by two different
 *     mechanisms and neither of them a write. A boolean seeds its VALUE: an
 *     unset key draws the declared state, a stored value beats it. A select
 *     seeds its PLACEHOLDER: an unset key draws the declared default's option
 *     LABEL where `InspectorSelectField`'s own em-dash ("nothing is selected")
 *     used to sit, a stored value still wins outright, and a select declaring
 *     nothing still draws the em-dash. (objectui#8450 made that placeholder
 *     reachable at all; before it the trigger was blank, because the sentinel
 *     the field bridges `''` through kept Radix from ever recognising the empty
 *     state. Blank and em-dash were the same fact about `defaultValue`, told
 *     twice — and both are now gone from the declaring fields.)
 *  2. Both writers of the property feed both repaired controls — the
 *     hand-written table here and the engine-published `configSchema` that
 *     `json-schema-to-fields` converts (`default: true` -> `defaultValue:
 *     'true'`, `default: 'POST'` -> `defaultValue: 'POST'`). Neither writer
 *     gets a carrier of its own; the render path is shared.
 *  3. The property also drives VISIBILITY: a declared default on a `showWhen`
 *     CONTROLLER changes which fields are on screen at all (`controllerAdmits`).
 *     That read site predates the repair and is unchanged by it.
 *  4. A boolean control can now distinguish "key absent" from "key stored as
 *     `false`" — the two used to render byte-identical DOM even though the
 *     runtime treats them oppositely, which is the mechanism that turned a
 *     missing display into a false assertion.
 *
 * Two describes guard the repair from below:
 *
 *  - the non-regression half (objectui#8350's lesson): every claim here is also
 *    satisfied by an inspector that renders NOTHING, so the controls'
 *    existence, their stored-value behaviour, the offered vocabulary and the
 *    deprecated-value fallback are pinned beside them.
 *  - the stored-`false` rows: an implementation strictly WORSE than the bug —
 *    a box that is ALWAYS checked — satisfies "an absent key shows checked".
 *    Only a stored `false` refuses it, so those rows are load bearing and must
 *    not be softened into "differs from absent".
 *
 * ⛔ These cases pin what the tree DOES. The direction they pin is triage's
 * ruling on objectui#6830, not this file's opinion.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { z } from 'zod';

// Mutable so a case can publish a server `configSchema` for one node type and
// exercise the ONLINE field derivation, which is the other writer of
// `defaultValue`. Hoisted because `vi.mock` factories run before the file body.
const stubs = vi.hoisted(() => ({ configSchemas: {} as Record<string, unknown> }));

vi.mock('../previews/useFlowNodePalette', () => ({
  useActionConfigSchemas: () => stubs.configSchemas,
  useFlowNodePalette: () => [],
}));
vi.mock('../previews/useObjectFields', () => ({
  useObjectFields: () => ({ fields: [], loading: false, error: null }),
}));

import { FlowNodeInspector } from './FlowNodeInspector';
import { fieldsForNodeType, FLOW_NODE_TYPE_OPTIONS } from './flow-node-config';
import type { MetadataSelection } from '../preview-registry';
// The runtime's own answer for an omitted `escalation` key. Imported so the
// #6620 rows below compare the RENDERED control against the installed contract
// instead of against a literal this file would then own a second copy of.
// ⛔ The subpath is load bearing: `ApprovalEscalationSchema` is NOT on the
// package root, where it reads `undefined` and any `.parse` on it throws.
import { ApprovalEscalationSchema, EndConfigSchema, FlowNodeSchema } from '@objectstack/spec/automation';

/* ── The `meta/*` double (objectui#7307) ───────────────────────────────
 * `FlowNodeInspector` renders `FlowReferenceField` for every reference-kind key
 * on the selected node, and that field resolves its combobox options through
 * `MetadataClient.list(type)` — a real `fetch` under happy-dom. Served here from
 * a RECORDING double in the shape `FlowNodeInspector.inactiveRetained.test.tsx`
 * already uses: an EMPTY registry in the `{ type, items: [] }` envelope, which
 * is byte-identical to what the hook's `.catch` produced before, and a recorder
 * whose `afterEach` fails on any URL outside the metadata routes — so an escape
 * to a data endpoint reds here instead of vanishing into a `.catch`.
 * ─────────────────────────────────────────────────────────────────────── */

const META_PREFIX = '/api/v1/meta/';

/** Every URL these renders handed the global `fetch`, in request order. */
let metaCalls: string[] = [];

const routeOf = (url: string) => url.split('?')[0];

function installMetaDouble() {
  metaCalls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(
        input && typeof input === 'object' && 'url' in input ? (input as { url: unknown }).url : input,
      );
      metaCalls.push(url);
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
}

beforeEach(() => {
  stubs.configSchemas = {};
  installMetaDouble();
});

afterEach(() => {
  // A router, not a sink: a request to anything but the metadata registry fails
  // here rather than being swallowed.
  expect(metaCalls.filter((url) => !routeOf(url).startsWith(META_PREFIX))).toEqual([]);
  // Unmount BEFORE restoring the real `fetch` (objectui#7439).
  cleanup();
  vi.unstubAllGlobals();
});

function draftWith(type: string, node: Record<string, unknown>) {
  return { nodes: [{ id: 'n1', type, label: 'Node', ...node }], edges: [] };
}

function renderInspector(draft: Record<string, unknown>) {
  const onPatch = vi.fn();
  const utils = render(
    <FlowNodeInspector
      type="flow"
      name="renewal"
      draft={draft}
      selection={{ kind: 'node', id: 'n1' } as MetadataSelection}
      onPatch={onPatch}
      onClearSelection={vi.fn()}
      readOnly={false}
      locale="en-US"
    />,
  );
  return { onPatch, ...utils };
}

/** The rendered text of a labelled select trigger (Radix `button[role=combobox]`). */
const triggerText = (name: string) => screen.getByRole('combobox', { name }).textContent;

/** The rendered checkbox for a labelled boolean control, or null when absent. */
const checkbox = (name: string) =>
  screen.queryByLabelText(name) as HTMLInputElement | null;

/** Whether a labelled select trigger is drawing a PLACEHOLDER rather than a selection. */
const triggerIsPlaceholder = (name: string) =>
  screen.getByRole('combobox', { name }).hasAttribute('data-placeholder');

describe('select: a declared defaultValue reaches the trigger as its placeholder (objectui#6830 arm A)', () => {
  it('select: an unset key states the declared "GET", not the em-dash', () => {
    // Premise, read from the table the inspector renders from.
    const method = fieldsForNodeType('http_request').find((f) => f.id === 'method');
    expect(method?.defaultValue, 'http_request.method declares a default').toBe('GET');

    renderInspector(draftWith('http_request', { config: {} }));

    // Measured on the RENDERED control, never on the declaration: the trigger's
    // own text. This row used to assert `'—'` — `InspectorSelectField`'s
    // "nothing is selected" mark — which was the defect stated as a pin.
    expect(
      triggerText('Method'),
      'the Method trigger states the default the runtime applies to an omitted key',
    ).toBe('GET');
    // ⭐ And it is still a PLACEHOLDER, not a selection. `data-placeholder` is
    // Radix's own trigger flag and what Shadcn styles the muted empty state
    // with, so the author can tell "nothing is stored, this is what happens"
    // from "I picked GET". Without this the repair would be indistinguishable
    // from one that silently selected the default on the author's behalf.
    expect(
      triggerIsPlaceholder('Method'),
      'the declared default is drawn as the placeholder, so it never reads as a stored choice',
    ).toBe(true);
  });

  it('select: a STORED value beats the declaration — the placeholder never wins over data', () => {
    // The regression guard. A repair that handed the default to the VALUE
    // instead of the placeholder passes the row above and fails this one.
    renderInspector(draftWith('http_request', { config: { method: 'POST' } }));
    expect(
      triggerText('Method'),
      'a stored POST renders as itself, and the declared GET is nowhere near it',
    ).toBe('POST');
    expect(
      triggerIsPlaceholder('Method'),
      'and it is a real selection, not a placeholder',
    ).toBe(false);
    expect(
      screen.queryByText('GET'),
      'the declared default does not shadow the value the author stored',
    ).toBeNull();
  });

  it('select: the same control DOES show "GET" when the key is stored — the lit control', () => {
    renderInspector(draftWith('http_request', { config: { method: 'GET' } }));
    expect(
      triggerText('Method'),
      'a stored GET renders, so every negative here is a real absence and not a dead document',
    ).toBe('GET');
    expect(screen.queryByText('GET'), 'the lit control fires').not.toBeNull();
  });

  it('select: a field declaring NO default is unchanged — it still draws the em-dash', () => {
    // The seed belongs to the DECLARATION, not to the control kind. Without
    // this row an implementation that invented a placeholder for every select
    // — or that promoted the first option — passes the whole file.
    // `notify.severity` is the offline table's undeclared select.
    const severity = fieldsForNodeType('notify').find((f) => f.id === 'severity');
    expect(severity?.kind, 'severity is a select').toBe('select');
    expect(severity?.defaultValue, 'and it declares no default').toBeUndefined();

    renderInspector(draftWith('notify', { config: {} }));
    expect(
      triggerText('Severity'),
      'an undeclared select still says "nothing is selected" and invents nothing',
    ).toBe('—');
  });

  it('select: showing the default WRITES nothing — the draft is untouched', () => {
    // ⛔ objectui#6263's fence — "the console needs no second default contract"
    // — and a test is the only thing that keeps it. A placeholder that also
    // committed would turn every visit to the inspector into a metadata edit,
    // freezing today's default into the node and un-tracking it from the spec.
    //
    // Both write channels are covered: `onPatch` is the only one this component
    // HAS, and the byte comparison catches a mutation that bypassed it.
    const draft = draftWith('http_request', { config: {} });
    const before = JSON.stringify(draft);
    const { onPatch } = renderInspector(draft);
    expect(triggerText('Method'), 'the declared default is on screen').toBe('GET');
    expect(
      onPatch.mock.calls,
      'rendering a placeholder-seeded select patches the draft exactly zero times',
    ).toEqual([]);
    expect(
      JSON.stringify(draft),
      'and the draft it was handed is unchanged byte for byte — nothing was written in place either',
    ).toBe(before);
  });
});

describe('boolean: a declared defaultValue seeds the control (objectui#8451, arm A)', () => {
  it('boolean: an unset key draws a CHECKED box, because the table declares true', () => {
    const notify = fieldsForNodeType('approval').find((f) => f.id === 'escalation.notifySubmitter');
    expect(notify?.defaultValue, 'escalation.notifySubmitter declares a default').toBe('true');

    // `enabled: true` is set only so the gated field is on screen at all; the
    // key under measurement (`notifySubmitter`) is the one left unset.
    renderInspector(draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24 } } }));

    const box = checkbox('Notify submitter');
    expect(box, 'the Notify submitter control is rendered').not.toBeNull();
    expect(
      box!.checked,
      'the box reads CHECKED, which is what the runtime applies to the omitted key',
    ).toBe(true);
  });

  it('boolean: showing the default WRITES nothing — the node still omits the key', () => {
    // The other half of "show, do not write". A seeded control that also
    // committed would turn every visit to the inspector into a metadata edit,
    // freezing today's default into the node and un-tracking it from the spec.
    const { onPatch } = renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24 } } }),
    );
    expect(checkbox('Notify submitter')!.checked, 'the seed is on screen').toBe(true);
    expect(
      onPatch.mock.calls,
      'rendering a seeded control patches the draft exactly zero times',
    ).toEqual([]);
  });

  it('boolean: a stored true renders checked — unchanged by the repair', () => {
    renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24, notifySubmitter: true } } }),
    );
    expect(checkbox('Notify submitter')!.checked, 'a stored true renders checked').toBe(true);
  });

  it('boolean: a stored FALSE beats the declared true and draws an UNCHECKED box', () => {
    // ⛔ Load bearing, and not interchangeable with "differs from the absent
    // rendering": this is the only row an ALWAYS-CHECKED control fails. Without
    // it, an implementation strictly worse than the bug — one that ignores both
    // the stored value and the declaration — satisfies every other claim here.
    renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24, notifySubmitter: false } } }),
    );
    expect(
      checkbox('Notify submitter')!.checked,
      'a deliberate false is the author\'s answer and outranks the declaration',
    ).toBe(false);
  });

  it('boolean: a field declaring NO default still draws unchecked when unset', () => {
    // The seed belongs to the DECLARATION, not to the control: a boolean with
    // nothing declared must not acquire a default from the repair. Measured on
    // the online writer because the offline table has no undeclared boolean to
    // measure — it carries exactly two boolean fields and both declare one.
    stubs.configSchemas = {
      approval: {
        type: 'object',
        properties: {
          escalation: {
            type: 'object',
            title: 'SLA escalation',
            properties: {
              enabled: { type: 'boolean', default: true },
              notifySubmitter: { type: 'boolean', title: 'Notify submitter' },
            },
          },
        },
      },
    };
    renderInspector(draftWith('approval', { config: { escalation: { timeoutHours: 24 } } }));
    const box = checkbox('Notify submitter');
    expect(box, 'the sibling is on screen — the gate default admitted it').not.toBeNull();
    expect(
      box!.checked,
      'and it draws unchecked, because this schema declares no default for it',
    ).toBe(false);
  });

  it('boolean: the gate seeds from the SPEC default, still with no worded claim (objectui#6620)', () => {
    // Was 'the #6620-wrong declaration ships NO worded claim'. `escalation.enabled`
    // used to be the one field in the offline table whose declared default
    // contradicted what the installed spec applies to an omitted key, so this row
    // pinned that the seed shipped no caption asserting the wrong default in words.
    // objectui#6620 fixed the declaration; the row now pins the repaired half —
    // the control the author sees agrees with the runtime — and the no-caption rule
    // still holds, now over a declaration that is right.
    //
    // ⭐ The expectation is DERIVED from the installed spec, never the literal
    // 'true'. A literal would restate the very claim that drifted: it passes just
    // as happily on the next upstream flip, which is how #6620 stayed invisible.
    const specEnabled = ApprovalEscalationSchema.safeParse({ timeoutHours: 24 });
    expect(specEnabled.success, 'a minimal escalation block must parse').toBe(true);
    const specDefault = (specEnabled.data as { enabled?: unknown } | undefined)?.enabled;
    // Vacuity guard: without it, a spec that stopped materialising the key would
    // turn both sides into `undefined` and the comparison into a tautology.
    expect(typeof specDefault, 'the spec still materialises `enabled` from an omitted key').toBe('boolean');

    const gate = fieldsForNodeType('approval').find((f) => f.id === 'escalation.enabled');
    // Defaults are strings in this table — the spelling `controllerAdmits` compares.
    expect(gate?.defaultValue, 'the table declares the default the spec applies').toBe(String(specDefault));

    renderInspector(draftWith('approval', { config: { escalation: { timeoutHours: 24 } } }));
    const box = checkbox('SLA escalation');
    expect(box, 'the gate control is on screen').not.toBeNull();
    expect(
      box!.checked,
      'and the RENDERED toggle carries the spec default — the defect was that it did not',
    ).toBe(specDefault);
    expect(
      box!.closest('label')?.textContent,
      'the control carries its label and nothing else — no caption naming a default',
    ).toBe('SLA escalation');
  });
});

describe('the online writer of defaultValue reaches the same repaired control', () => {
  it('a server-published `default` is derived into the field and rendered', () => {
    // `json-schema-to-fields` turns JSON-Schema `default: 'POST'` into
    // `defaultValue: 'POST'` — the ONLINE half of the same property. The render
    // path is shared, so the repair reaches it without a second carrier, which
    // is the shape objectui#7238 removed and this file must not reintroduce.
    stubs.configSchemas = {
      http_request: {
        type: 'object',
        properties: {
          method: { type: 'string', title: 'Method', enum: ['GET', 'POST'], default: 'POST' },
        },
      },
    };
    renderInspector(draftWith('http_request', { config: {} }));

    expect(
      triggerText('Method'),
      'the server-derived default states itself on the trigger, same as the hand-written half',
    ).toBe('POST');
    expect(
      triggerIsPlaceholder('Method'),
      'and still as a placeholder — the online writer does not write either',
    ).toBe(true);
  });
});

describe('the one read site: a declared default on a showWhen CONTROLLER changes visibility', () => {
  /**
   * `controllerAdmits` resolves an UNSET controller through its `defaultValue`.
   *
   * The hand-written approval group used to declare `escalation.enabled: 'false'`,
   * so the offline table could not demonstrate the effect at all — an absent
   * default and a 'false' default both hide the group, which is precisely why the
   * divergence survived: the two writers of this property answered the same node
   * differently and only the engine-published one was pinned. objectui#6620 made
   * the table declare the spec's `.default(true)`, so BOTH writers are exercised
   * here now, and the offline row below is the one that changed.
   */
  const escalationSchema = {
    type: 'object',
    properties: {
      escalation: {
        type: 'object',
        title: 'SLA escalation',
        properties: {
          enabled: { type: 'boolean', default: true },
          notifySubmitter: { type: 'boolean', title: 'Notify submitter', default: true },
        },
      },
    },
  };

  it('a gate whose default is true reveals its siblings for a node that omits the key', () => {
    stubs.configSchemas = { approval: escalationSchema };
    renderInspector(draftWith('approval', { config: { escalation: { timeoutHours: 24 } } }));
    const sibling = checkbox('Notify submitter');
    expect(
      sibling,
      'the sibling is on screen because the gate default resolved to true',
    ).not.toBeNull();
    // objectui#8451 — and the ONLINE writer's own `default: true` seeds it, so
    // the repair is not a property of the hand-written table.
    expect(
      sibling!.checked,
      'the engine-published default reaches the control too',
    ).toBe(true);
  });

  it('and hides them when the gate is stored off — the lit control for the same predicate', () => {
    stubs.configSchemas = { approval: escalationSchema };
    renderInspector(draftWith('approval', { config: { escalation: { enabled: false } } }));
    expect(
      checkbox('Notify submitter'),
      'a stored false beats the declared default, so the predicate really is being evaluated',
    ).toBeNull();
  });

  it('the offline table REVEALS the same siblings — it declares the gate true (objectui#6620)', () => {
    // Was 'the offline table hides the same siblings, because it declares the gate
    // false' — recorded there, explicitly not endorsed, because the hand-written
    // 'false' contradicted the spec's `.default(true)`. objectui#6620 removed the
    // divergence, so the two writers now answer this node identically. The row is
    // updated to the new truth rather than worked around: it exists to make a
    // change to either side visible, and this was that change.
    renderInspector(draftWith('approval', { config: { escalation: { timeoutHours: 24 } } }));
    const sibling = checkbox('Notify submitter');
    expect(
      sibling,
      'offline, the same node reveals the sibling the online schema reveals',
    ).not.toBeNull();
    expect(
      sibling!.checked,
      'and the offline table seeds it from its own declared default too',
    ).toBe(true);
  });

  /**
   * NON-REGRESSION (objectui#6620). Derived from a plausible WRONG FIX rather
   * than from the bug: revealing the sub-fields unconditionally — dropping the
   * `showWhen` gates, or making `controllerAdmits` fall through to `true` —
   * satisfies "a node that omits the key now reveals" completely, while
   * destroying the author's ability to turn escalation OFF.
   *
   * So the stored `false` must still beat the declared default, and must still
   * hide EVERY sibling, not just the first. Four keys, named individually: an
   * assertion over one of them passes on a fix that leaks the other three.
   */
  it('a node that explicitly stores `enabled: false` still hides every sibling', () => {
    renderInspector(draftWith('approval', { config: { escalation: { enabled: false } } }));
    expect(checkbox('SLA escalation')!.checked, 'the stored false beats the declared true').toBe(false);
    for (const label of ['Timeout (hours)', 'On timeout', 'Escalate to', 'Notify submitter']) {
      expect(
        screen.queryByText(label),
        `'${label}' must stay hidden while the author has switched escalation off`,
      ).toBeNull();
    }
  });
});

describe('absent and stored-false are now DISTINGUISHABLE on a boolean control', () => {
  it('renders differently when the key is missing than when it is explicitly false', () => {
    renderInspector(draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24 } } }));
    const absentBox = checkbox('Notify submitter')!;
    const absentChecked = absentBox.checked;
    const absent = absentBox.outerHTML;
    cleanup();
    renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24, notifySubmitter: false } } }),
    );
    const storedFalseBox = checkbox('Notify submitter')!;
    const storedFalseChecked = storedFalseBox.checked;
    const storedFalse = storedFalseBox.outerHTML;

    // Named states, not just an inequality: "the two differ" is also satisfied
    // by a control that gets BOTH wrong, so each side is asserted on its own.
    expect(absentChecked, 'the omitted key draws the declared true').toBe(true);
    expect(storedFalseChecked, 'the deliberate false draws unchecked').toBe(false);
    expect(
      absent,
      'and the difference reaches the DOM — the author can tell them apart',
    ).not.toBe(storedFalse);
  });
});

describe('non-regression — a change that deletes the control must not pass this file', () => {
  /** The `notifySubmitter` value the last `onPatch` call carries, if any. */
  const committed = (onPatch: { mock: { calls: unknown[][] } }) =>
    (
      onPatch.mock.calls.at(-1)?.[0] as
        | { nodes: Array<{ config: { escalation?: Record<string, unknown> } }> }
        | undefined
    )?.nodes[0].config.escalation?.notifySubmitter;

  it('the boolean control exists, is a checkbox, and commits the author edit', () => {
    // Both directions, because the repair moved the seeded state: clicking a
    // control that shows the declared `true` must write the author's `false`,
    // and clicking one that shows a stored `false` must write `true`. A control
    // that committed the state it merely SHOWS would pass one and fail the other.
    const { onPatch } = renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24 } } }),
    );
    const box = checkbox('Notify submitter');
    expect(box, 'the control is rendered at all').not.toBeNull();
    expect(box!.type, 'and it is a real checkbox input').toBe('checkbox');
    box!.click();
    expect(
      committed(onPatch),
      'clicking a seeded-true box writes the explicit false — the control is live, not decorative',
    ).toBe(false);

    cleanup();
    const second = renderInspector(
      draftWith('approval', { config: { escalation: { enabled: true, timeoutHours: 24, notifySubmitter: false } } }),
    );
    checkbox('Notify submitter')!.click();
    expect(
      committed(second.onPatch),
      'and clicking a stored-false box writes true',
    ).toBe(true);
  });

  it('the select control exists, offers its declared options, and commits', () => {
    renderInspector(draftWith('http_request', { config: {} }));
    const trigger = screen.queryByRole('combobox', { name: 'Method' });
    expect(trigger, 'the Method control is rendered at all').not.toBeNull();
    const method = fieldsForNodeType('http_request').find((f) => f.id === 'method');
    expect(
      method?.options?.map((o) => o.value),
      'and the five HTTP verbs are still the offered vocabulary',
    ).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  });

  it('a stored value the options dropped still renders, flagged deprecated', () => {
    renderInspector(draftWith('http_request', { config: { method: 'TRACE' } }));
    expect(
      triggerText('Method'),
      'a legacy stored verb is never silently blanked',
    ).toBe('TRACE (deprecated)');
  });
});

describe('the declaration surface this card names', () => {
  /**
   * The eleven declaring fields, as `<node type>.<field id>`. Triage named
   * this list the acceptance surface, so it is pinned: a PR that retires the
   * property, or that adds a twelfth declaration, moves this line.
   *
   * ⚠️ The number is NOT a constant to copy. objectui#9278 and objectui#9277
   * both move this line from the same base, so each computed it as the value
   * standing here when it landed PLUS its own additions, and said in its PR
   * body where it read the base from. Do the same rather than trusting either
   * card's arithmetic — both were done assuming the other does not exist.
   *
   * Swept over the picker's node types plus the four that carry config but are
   * not offered in the picker (ADR-0031 import/export-only, and the legacy
   * aliases). The sweep is asserted to cover the picker so a new node type
   * cannot slip a declaration past it.
   */
  const OFF_PICKER_TYPES = ['boundary_event', 'parallel_gateway', 'join_gateway', 'legacy_action', 'notify'];

  it('exactly eleven fields declare a defaultValue, and these are they', () => {
    const swept = [...FLOW_NODE_TYPE_OPTIONS, ...OFF_PICKER_TYPES];
    expect(
      FLOW_NODE_TYPE_OPTIONS.every((t) => swept.includes(t)),
      'the sweep covers every node type the picker offers',
    ).toBe(true);

    const declaring = new Set<string>();
    for (const type of swept) {
      for (const field of fieldsForNodeType(type)) {
        if (field.defaultValue !== undefined) declaring.add(`${type}.${field.id}`);
      }
    }
    expect([...declaring].sort()).toEqual([
      'approval.escalation.action',
      'approval.escalation.enabled',
      'approval.escalation.notifySubmitter',
      'approval.behavior',
      'approval.maxRevisions',
      'approval.onEmptyApprovers',
      'boundary_event.boundaryConfig.eventType',
      'end.outcome',
      'http_request.method',
      'screen.mode',
      'wait.waitEventConfig.eventType',
    ].sort());
  });

  /**
   * Arm A's select half over the WHOLE acceptance surface, not demonstrated on
   * one field. Triage named the declaring-field list the acceptance surface and
   * told the implementer to re-derive each entry's `kind` rather than inherit a
   * list, so the re-derivation is the test: every select-kind declaring field
   * is rendered on a node of its own type with an EMPTY config, and the
   * trigger's text is read.
   *
   * The expected text is DERIVED — the declaring field's own matching option
   * label — never spelled out, so this row cannot decay into the table
   * restating itself. The id list IS spelled out, because that is the surface
   * whose growth should be visible in review.
   */
  it('every select-kind declaring field renders its declared default', () => {
    const swept = [...FLOW_NODE_TYPE_OPTIONS, ...OFF_PICKER_TYPES];
    const cases: Array<{ id: string; type: string; label: string; expected: string }> = [];
    for (const type of swept) {
      for (const field of fieldsForNodeType(type)) {
        if (field.kind !== 'select' || field.defaultValue === undefined) continue;
        const option = field.options?.find((o) => o.value === field.defaultValue);
        // Every offline declaration names an offered option today. When one
        // stops doing so the control falls back to the raw value, which is a
        // deliberate branch in `FlowNodeConfigField` — but it is also a table
        // defect, so it reddens here rather than rendering quietly.
        expect(
          option,
          `${type}.${field.id}: the declared default must be one of the offered options`,
        ).toBeDefined();
        cases.push({ id: `${type}.${field.id}`, type, label: field.label, expected: option!.label });
      }
    }

    expect(
      cases.map((c) => c.id).sort(),
      'the select-kind half of the declaration surface — eight of the eleven',
    ).toEqual([
      'approval.behavior',
      'approval.escalation.action',
      'approval.onEmptyApprovers',
      'boundary_event.boundaryConfig.eventType',
      'end.outcome',
      'http_request.method',
      'screen.mode',
      'wait.waitEventConfig.eventType',
    ]);

    for (const c of cases) {
      renderInspector(draftWith(c.type, { config: {} }));
      expect(
        triggerText(c.label),
        `${c.id}: an unset key states the declared default on the trigger`,
      ).toBe(c.expected);
      expect(
        triggerIsPlaceholder(c.label),
        `${c.id}: and states it as a placeholder, never as a selection`,
      ).toBe(true);
      cleanup();
    }
  });
});

/* ── objectui#9278: the `end` node's Outcome vocabulary ───────────────────────
 * `end.config.outcome` was a free-text box whose placeholder printed
 * `success · failure`. `FlowNodeSchema` discriminates an `end` node's config
 * through `EndConfigSchema`, whose `outcome` is a CLOSED enum of
 * `completed | refused` — so BOTH printed words are refused at the door. On a
 * key with no dropdown that placeholder was the only vocabulary the form
 * offered, so the author's most likely action was to type one of the two words
 * in the box, and the flow then failed to load. Commandment #0 one level down:
 * the VALUES are part of the contract too.
 *
 * Every expectation below is DERIVED from the installed spec, through zod's
 * public `toJSONSchema` rather than any wrapper internals — the `defaultValue`
 * doc comment requires a declaration outside the escalation ledger to be
 * derived from the spec rather than from taste, and a row that respelled the
 * two words here would agree with itself while the form drifted.
 *
 * The parse rows are what make that derivation a READING rather than a dead
 * probe, and they carry both signs in one output: every derived option is
 * accepted at the door, and the two words the deleted placeholder printed are
 * refused there. An accept-only loop would pass just as well against a schema
 * that accepts everything.
 * ─────────────────────────────────────────────────────────────────────────── */
describe('the end node offers the outcomes the spec accepts (objectui#9278)', () => {
  /** `{ enum, default }` for `EndConfigSchema.outcome`, read off the installed spec. */
  const outcomeSchema = (
    z.toJSONSchema(EndConfigSchema) as {
      properties?: Record<string, { enum?: unknown[]; default?: unknown }>;
    }
  ).properties?.outcome;
  const specOutcomes = (outcomeSchema?.enum ?? []) as string[];
  const specDefault = outcomeSchema?.default as string | undefined;

  /**
   * The sibling an option requires, so an option's own row measures the OPTION.
   * `refused` carries a cross-field rule — it requires a `message` — and a row
   * that sent the bare key would read that refusal as "the enum rejects
   * `refused`" and delete a value the contract declares.
   */
  const siblingFor = (outcome: string) =>
    outcome === 'refused' ? { message: 'Refused: {record.name} is a confirmed duplicate' } : {};

  const outcomeField = () => fieldsForNodeType('end').find((f) => f.id === 'outcome');

  it('the spec still publishes the closed enum and the default this field derives from', () => {
    // THE VACUITY GUARD. Every row below iterates `specOutcomes`; a spec that
    // stopped publishing the enum — or a `toJSONSchema` shape this reader stops
    // understanding — would make each of them pass over an EMPTY list, which is
    // exactly the shape a derived expectation fails silently in.
    expect(specOutcomes.length, 'EndConfigSchema.outcome publishes a closed enum').toBeGreaterThan(1);
    expect(specOutcomes, 'and the default it applies to an omitted key is one of them').toContain(specDefault);
  });

  it('and FlowNodeSchema judges an end node through it — both signs, one reading', () => {
    const verdict = (outcome: string) =>
      FlowNodeSchema.safeParse({
        id: 'e',
        type: 'end',
        label: 'E',
        config: { outcome, ...siblingFor(outcome) },
      }).success;

    for (const outcome of specOutcomes) {
      expect(verdict(outcome), `${outcome}: a derived option is accepted at the door`).toBe(true);
    }
    // The negative half, in the same reading — the two words the deleted
    // placeholder printed, which is the whole defect this card is about.
    expect(verdict('success'), '`success` — the old placeholder’s first word — is refused').toBe(false);
    expect(verdict('failure'), '`failure` — its second — is refused').toBe(false);
  });

  it('the Outcome control is a select over exactly those outcomes, stating the spec default', () => {
    const field = outcomeField();
    expect(field, 'the end node still has an Outcome field').toBeDefined();
    expect(field!.kind, 'an enum key is not authored as a free-text box').toBe('select');
    expect(
      field!.options?.map((o) => o.value),
      'the offered vocabulary IS the spec enum, in the spec’s own order',
    ).toEqual([...specOutcomes]);
    expect(field!.defaultValue, 'and the form states the default the spec applies').toBe(specDefault);
    // The invented vocabulary is gone rather than merely outvoted. A select
    // needs no placeholder — the declared default draws in that slot — so any
    // surviving string here would be a second, unchecked vocabulary.
    expect(field!.placeholder, 'no invented placeholder survives on this field').toBeUndefined();
  });

  it('and it RENDERS as a combobox on an end node, stating that default on the trigger', () => {
    // The non-regression half this file keeps beside every table claim: the
    // three rows above are all satisfied by an inspector that renders nothing.
    renderInspector(draftWith('end', { config: {} }));
    expect(
      screen.queryByRole('combobox', { name: 'Outcome' }),
      'the Outcome control is rendered at all',
    ).not.toBeNull();
    const declared = outcomeField()!.options?.find((o) => o.value === specDefault);
    expect(declared, 'the declared default must be one of the offered options').toBeDefined();
    expect(triggerText('Outcome'), 'an unset key states the declared default').toBe(declared!.label);
    expect(
      triggerIsPlaceholder('Outcome'),
      'and states it as a placeholder, never as a selection the author made',
    ).toBe(true);
  });
});
