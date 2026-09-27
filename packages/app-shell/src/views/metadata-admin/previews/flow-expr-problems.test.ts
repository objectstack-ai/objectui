// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { describe, it, expect } from 'vitest';
import { flowExpressionProblems } from './flow-expr-problems';

const startUpdate = { id: 'start', type: 'start', config: { triggerType: 'record-after-update', objectName: 'crm_lead' } };

describe('flowExpressionProblems', () => {
  it('flags a brace-in-CEL error on a decision branch expression (node target)', () => {
    const draft = {
      variables: [],
      nodes: [
        startUpdate,
        { id: 'd', type: 'decision', config: { conditions: [{ label: 'Big', expression: '{record.amount} > 10' }] } },
      ],
      edges: [{ source: 'start', target: 'd' }],
    };
    const ps = flowExpressionProblems(draft);
    const brace = ps.find((p) => p.level === 'error');
    expect(brace).toBeDefined();
    expect(brace!.target).toEqual({ kind: 'node', nodeId: 'd' });
    expect(brace!.message).toMatch(/Big:.*map literal/);
  });

  it('flags an unknown reference (warning) on a downstream decision condition', () => {
    const draft = {
      variables: [{ name: 'lead_score' }],
      nodes: [
        startUpdate,
        { id: 'd', type: 'decision', config: { condition: 'lead_scor >= 60' } },
      ],
      edges: [{ source: 'start', target: 'd' }],
    };
    const ps = flowExpressionProblems(draft);
    const warn = ps.find((p) => p.level === 'warning');
    expect(warn).toBeDefined();
    expect(warn!.target).toEqual({ kind: 'node', nodeId: 'd' });
    expect(warn!.message).toMatch(/did you mean `lead_score`/);
  });

  it('does NOT flag bare trigger fields on the START node (skipped)', () => {
    const draft = {
      variables: [],
      nodes: [{ id: 'start', type: 'start', config: { triggerType: 'record-after-update', objectName: 'crm_lead', condition: 'status == "qualifying" && previous.status != "qualifying"' } }],
      edges: [],
    };
    expect(flowExpressionProblems(draft)).toEqual([]);
  });

  it('flags a brace error on an edge guard (edge target)', () => {
    const draft = {
      variables: [],
      nodes: [startUpdate, { id: 'a', type: 'assignment', config: {} }, { id: 'b', type: 'end' }],
      edges: [
        { source: 'start', target: 'a' },
        { source: 'a', target: 'b', condition: '{record.x} == 1' },
      ],
    };
    const ps = flowExpressionProblems(draft);
    const edgeP = ps.find((p) => p.target.kind === 'edge');
    expect(edgeP).toBeDefined();
    expect(edgeP!.level).toBe('error');
    expect(edgeP!.target).toEqual({ kind: 'edge', source: 'a', target: 'b' });
  });

  it('ignores default edges and empty conditions', () => {
    const draft = {
      variables: [],
      nodes: [startUpdate, { id: 'a', type: 'assignment', config: {} }],
      edges: [{ source: 'start', target: 'a', isDefault: true, condition: '{bad}' }],
    };
    expect(flowExpressionProblems(draft)).toEqual([]);
  });

  it('returns nothing for a clean flow', () => {
    const draft = {
      variables: [{ name: 'lead_score' }],
      nodes: [startUpdate, { id: 'd', type: 'decision', config: { condition: 'lead_score >= 60 && record.amount > 0' } }],
      edges: [{ source: 'start', target: 'd' }],
    };
    expect(flowExpressionProblems(draft)).toEqual([]);
  });

  it('does NOT flag a loop collection `{leadList}` — it is a template surface, not a CEL predicate', () => {
    // The collection field is refMode:'template', so its single-brace `{var}`
    // template is legal and must not trip the CEL brace-trap (the pre-fix bug).
    const draft = {
      variables: [{ name: 'leadList' }],
      nodes: [
        startUpdate,
        { id: 'each', type: 'loop', config: { collection: '{leadList}', iteratorVariable: 'lead' } },
      ],
      edges: [{ source: 'start', target: 'each' }],
    };
    expect(flowExpressionProblems(draft)).toEqual([]);
  });

  it('still flags a genuine CEL predicate on the same flow (decision condition)', () => {
    // Guards against over-broadening the template skip: real predicate fields
    // keep their brace-trap.
    const draft = {
      variables: [],
      nodes: [
        startUpdate,
        { id: 'each', type: 'loop', config: { collection: '{leadList}' } },
        { id: 'd', type: 'decision', config: { condition: '{record.amount} > 10' } },
      ],
      edges: [
        { source: 'start', target: 'each' },
        { source: 'each', target: 'd' },
      ],
    };
    const ps = flowExpressionProblems(draft);
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ level: 'error', target: { kind: 'node', nodeId: 'd' } });
  });
});

describe("a screen field's visibleWhen is judged over the screen's declared fields, not the flow scope (objectui#10743)", () => {
  // `needsApproval` is a flow variable, so it IS in the flow scope at the screen;
  // `discount` is a sibling field on the screen and is NOT in the flow scope.
  const draft = (visibleWhen: unknown, extraNodes: Array<Record<string, unknown>> = [], extraEdges: Array<Record<string, unknown>> = []) => ({
    variables: [{ name: 'needsApproval', type: 'boolean' }],
    nodes: [
      startUpdate,
      {
        id: 'review',
        type: 'screen',
        config: {
          fields: [
            { name: 'discount', label: 'Discount %', type: 'number' },
            { name: 'note', label: 'Note', type: 'text', visibleWhen },
            { name: 'comment', label: 'Comment', type: 'text' },
          ],
        },
      },
      ...extraNodes,
    ],
    edges: [{ source: 'start', target: 'review' }, ...extraEdges],
  });

  it.each([
    ['a sibling field', 'discount > 0'],
    ['a sibling field under the record namespace', 'record.discount > 0'],
    ['a comprehension over a sibling field', '["a","b"].exists(t, t == note)'],
    ['control: no predicate', undefined],
  ])('%s: no problem on the screen', (_name, visibleWhen) => {
    expect(flowExpressionProblems(draft(visibleWhen))).toEqual([]);
  });

  it('a run variable the flow scope holds is the unknown reference on the screen, named by field and root', () => {
    const ps = flowExpressionProblems(draft('needsApproval == true'));
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ level: 'warning', target: { kind: 'node', nodeId: 'review' } });
    expect(ps[0].message).toMatch(/^Note: /);
    expect(ps[0].message).toMatch(/`needsApproval` is not a field on this screen/);
  });

  it('a {var} brace in the column is still the brace error, ahead of the scope', () => {
    const ps = flowExpressionProblems(draft('{discount} > 0'));
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ level: 'error', target: { kind: 'node', nodeId: 'review' } });
  });

  it('control: a decision condition downstream keeps the FLOW scope — the run variable is in scope there, and so is the screen output the field becomes; an unknown root still warns with the flow wording', () => {
    // The same identifier is clean on the decision and the unknown reference on
    // the screen: `needsApproval` is a flow variable; `discount`, collected by
    // the screen, is a flow variable downstream of it (`nodeOutputRefs`).
    const inScope = { id: 'd', type: 'decision', config: { condition: 'needsApproval == true && discount > 0' } };
    expect(flowExpressionProblems(draft('discount > 0', [inScope], [{ source: 'review', target: 'd' }]))).toEqual([]);
    const unknown = { id: 'd', type: 'decision', config: { condition: 'needsAproval == true' } };
    const ps = flowExpressionProblems(draft(undefined, [unknown], [{ source: 'review', target: 'd' }]));
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ level: 'warning', target: { kind: 'node', nodeId: 'd' } });
    expect(ps[0].message).toMatch(/did you mean `needsApproval`/);
  });
});
