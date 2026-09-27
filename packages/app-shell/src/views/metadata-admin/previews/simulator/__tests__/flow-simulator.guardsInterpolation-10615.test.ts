// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The Debug run evaluates edge guards and interpolates assignment values the
 * way the runtime does (objectui#10615).
 *
 * Guards used to run on `@object-ui/core`'s `ExpressionEvaluator`, which is not
 * CEL: `size(rows) > 0` failed and took the default branch, `n == "2"` was true
 * for `n = 2`, `7 / 2` was 3.5, `vars.n` and `record.n` were not defined while
 * `data.n` was. The runtime evaluates a guard on `@objectstack/formula`'s
 * `ExpressionEngine` against its flow scope. It refuses a malformed guard at
 * `registerFlow`, before the run, and throws on a CEL fault, which fails the
 * run. The expected answers below are the runtime's,
 * read from `AutomationEngine.evaluateCondition` and `registerFlow` in
 * `@objectstack/service-automation`.
 *
 * Assignment values used to be interpolated only when the value itself was a
 * string. The runtime's `interpolate` walks arrays and objects.
 *
 * Every run goes through the real `FlowSimulator`.
 */

import { describe, it, expect } from 'vitest';
import { STRUCTURAL_CONDITION_SHAPE_REFUSAL } from '@objectstack/spec/automation';
import { EVALUATED_EXPRESSION_SOURCE_REQUIRED } from '@objectstack/spec/shared';
import { FlowSimulator } from '../flow-simulator';
import type { SimEdge, SimNode } from '../flow-sim-types';

/** start → decision → yes | no (default), with `condition` on the edge to `yes`. */
function runGuard(condition: unknown, seed: Record<string, unknown> = {}) {
  const nodes: SimNode[] = [
    { id: 's', type: 'start' },
    { id: 'd', type: 'decision' },
    { id: 'yes', type: 'end' },
    { id: 'no', type: 'end' },
  ];
  const edges = [
    { source: 's', target: 'd' },
    { id: 'g', source: 'd', target: 'yes', condition },
    { id: 'def', source: 'd', target: 'no', isDefault: true },
  ] as SimEdge[];
  const sim = new FlowSimulator(nodes, edges);
  sim.reset(seed);
  sim.runToEnd();
  const step = sim.state.steps.find((st) => st.nodeId === 'd');
  return { sim, step, guard: step?.edges?.find((x) => x.edgeId === 'g') };
}

/** start → assignment({ assignments }) → end, run to completion from `seed`. */
function runAssignment(assignments: Record<string, unknown>, seed: Record<string, unknown> = {}) {
  const nodes: SimNode[] = [
    { id: 's', type: 'start' },
    { id: 'a', type: 'assignment', config: { assignments } },
    { id: 'e', type: 'end' },
  ];
  const sim = new FlowSimulator(nodes, [
    { source: 's', target: 'a' },
    { source: 'a', target: 'e' },
  ]);
  sim.reset(seed);
  sim.runToEnd();
  expect(sim.state.status).toBe('done');
  return sim.state.variables;
}

describe('an edge guard is evaluated as CEL on the runtime engine and scope (objectui#10615)', () => {
  const takes: Array<[string, string, Record<string, unknown>]> = [
    ['the CEL stdlib: size()', 'size(rows) > 0', { rows: [1, 2] }],
    ['a macro', 'rows.exists(r, r > 1)', { rows: [1, 2] }],
    ['integer division', '7 / 2 == 3', {}],
    ['the `vars` root', 'vars.n == 2', { n: 2 }],
    ['the `record` root', 'record.n == 2', { n: 2 }],
    ['a dotted variable key, nested', 'order.amount > 5', { 'order.amount': 9 }],
    ['a truthy non-boolean value', 'n', { n: 1 }],
  ];

  it.each(takes)('%s takes the guarded branch', (_name, source, seed) => {
    const { sim, guard } = runGuard(source, seed);
    expect(guard?.result).toBe(true);
    expect(guard?.error).toBeUndefined();
    expect(sim.state.visitedNodeIds).toContain('yes');
    expect(sim.state.visitedNodeIds).not.toContain('no');
    expect(sim.state.status).toBe('done');
  });

  it('CEL equality does not convert types: n == "2" is false for n = 2', () => {
    const { sim, guard } = runGuard('n == "2"', { n: 2 });
    expect(guard?.result).toBe(false);
    expect(guard?.error).toBeUndefined();
    expect(sim.state.visitedNodeIds).toContain('no');
    expect(sim.state.visitedNodeIds).not.toContain('yes');
  });
});

describe('a guard the runtime refuses or cannot evaluate fails the run (objectui#10615)', () => {
  const faults: Array<[string, unknown, Record<string, unknown>]> = [
    ['a `data` root, which the runtime scope does not bind', 'data.n == 2', { n: 2 }],
    ['an unknown variable', 'missing > 1', {}],
    ['an int compared with a double', '7 / 2 == 3.5', {}],
    ['a `${…}` template, which is not CEL', '${n > 1}', { n: 2 }],
    ['a `{var}` template brace, which is not CEL', '{n} == 2', { n: 2 }],
    ['an envelope in a dialect other than cel', { dialect: 'template', source: 'n == 2' }, { n: 2 }],
    ['a boolean, which is not a condition shape', true, {}],
  ];

  it.each(faults)('%s', (_name, condition, seed) => {
    const { sim, step, guard } = runGuard(condition, seed);
    expect(guard?.error).toBeTruthy();
    expect(guard?.result).toBe(false);
    expect(step?.status).toBe('error');
    expect(sim.state.status).toBe('error');
    // No branch runs, the default included: the runtime throws on a CEL fault
    // here, and refuses the other shapes at `registerFlow`, before the run.
    expect(sim.state.visitedNodeIds).not.toContain('yes');
    expect(sim.state.visitedNodeIds).not.toContain('no');
  });

  it('a blank guard is refused by the evaluated-slot rule', () => {
    const { sim, step } = runGuard('   ');
    expect(step?.status).toBe('error');
    expect(step?.error).toContain(EVALUATED_EXPRESSION_SOURCE_REQUIRED);
    expect(sim.state.visitedNodeIds).not.toContain('no');
  });

  it('a boolean is refused by the structural-condition rule', () => {
    const { step } = runGuard(true);
    expect(step?.status).toBe('error');
    expect(step?.error).toContain(STRUCTURAL_CONDITION_SHAPE_REFUSAL);
  });

  it('a failing guard after a true one still fails the run', () => {
    const nodes: SimNode[] = [
      { id: 's', type: 'start' },
      { id: 'd', type: 'decision' },
      { id: 'a', type: 'end' },
      { id: 'b', type: 'end' },
    ];
    const sim = new FlowSimulator(nodes, [
      { source: 's', target: 'd' },
      { id: 'ga', source: 'd', target: 'a', condition: 'n > 1' },
      { id: 'gb', source: 'd', target: 'b', condition: 'missing > 1' },
    ]);
    sim.reset({ n: 2 });
    sim.runToEnd();
    // Whether `a` ran first is not asserted: the runtime runs a true branch
    // before it evaluates the next guard, and the simulator does not model that.
    expect(sim.state.status).toBe('error');
    expect(sim.state.steps.find((st) => st.nodeId === 'd')?.status).toBe('error');
    expect(sim.state.visitedNodeIds).not.toContain('b');
  });
});

/**
 * Shapes the edge's `condition` schema refuses at `FlowSchema.parse`, so the
 * runtime never registers the flow. Three of them used to read as "no
 * condition" and take the default branch, and the envelope with no `dialect`
 * was evaluated and took its branch; only an omitted guard (`undefined`) reads
 * as "no condition" now.
 */
describe('a guard shape the edge schema refuses is refused, not read as absent (objectui#10615)', () => {
  const refused: Array<[string, unknown, string | undefined]> = [
    ["an empty string (the evaluated slot's non-blank rule)", '', EVALUATED_EXPRESSION_SOURCE_REQUIRED],
    ["an envelope with an empty source (`EvaluatedExpressionSchema`'s source rule)", { dialect: 'cel', source: '' }, EVALUATED_EXPRESSION_SOURCE_REQUIRED],
    ['an envelope with no dialect (`ExpressionSchema` requires one)', { source: 'n == 2' }, undefined],
    ['null (the condition is optional, not nullable)', null, undefined],
  ];

  it.each(refused)('%s', (_name, condition, rule) => {
    const { sim, step, guard } = runGuard(condition, { n: 2 });
    expect(guard?.error).toBeTruthy();
    expect(guard?.error).not.toBe('Branch has no condition.');
    expect(step?.status).toBe('error');
    if (rule) expect(step?.error).toContain(rule);
    expect(sim.state.status).toBe('error');
    expect(sim.state.visitedNodeIds).not.toContain('yes');
    expect(sim.state.visitedNodeIds).not.toContain('no');
  });
});

describe('guard controls: answers that do not change (objectui#10615)', () => {
  it('a true guard takes its branch, a false one the default', () => {
    expect(runGuard('n > 1', { n: 2 }).sim.state.visitedNodeIds).toContain('yes');
    const off = runGuard('n > 5', { n: 2 });
    expect(off.guard?.result).toBe(false);
    expect(off.guard?.error).toBeUndefined();
    expect(off.sim.state.visitedNodeIds).toContain('no');
  });

  it('an edge with no condition is still reported as such, and not taken', () => {
    const { sim, guard } = runGuard(undefined);
    expect(guard?.error).toBe('Branch has no condition.');
    expect(sim.state.visitedNodeIds).toContain('no');
  });
});

describe('assignment values are interpolated the way the runtime interpolates them (objectui#10615)', () => {
  it('a {token} inside a nested object is interpolated', () => {
    const vars = runAssignment({ who: 'Ada', o: { greet: 'hi {who}' } });
    expect(vars.o).toEqual({ greet: 'hi Ada' });
  });

  it('every element of an array is interpolated; a non-string element is kept', () => {
    const vars = runAssignment({ who: 'Ada', list: ['{who}', 'x {who}', 3] });
    expect(vars.list).toEqual(['Ada', 'x Ada', 3]);
  });

  it('a whole token keeps its type inside an object', () => {
    const vars = runAssignment({ n: 2, o: { v: '{n}' } });
    expect((vars.o as { v: unknown }).v).toBe(2);
  });

  it('a key is not interpolated', () => {
    const vars = runAssignment({ who: 'Ada', o: { '{who}': 'v' } });
    expect(vars.o).toEqual({ '{who}': 'v' });
  });

  it('a whole token naming no variable is undefined; inside a string it is empty', () => {
    const vars = runAssignment({ whole: '{missing}', inside: 'a {missing} b' });
    expect('whole' in vars).toBe(true);
    expect(vars.whole).toBeUndefined();
    expect(vars.inside).toBe('a  b');
  });

  it('an object token inside a string renders as JSON', () => {
    const vars = runAssignment({ o: { x: 1 }, v: 'o={o}' });
    expect(vars.v).toBe('o={"x":1}');
  });

  it('a dotted token walks into an object variable and indexes an array', () => {
    const vars = runAssignment({ order: { amount: 9 }, list: ['a', 'b'], amount: '{order.amount}', second: '{list.1}' });
    expect(vars.amount).toBe(9);
    expect(vars.second).toBe('b');
  });

  it('control: a token-free nested value is written unchanged', () => {
    const vars = runAssignment({ meta: { a: 1, b: 'plain', c: [true, null] } });
    expect(vars.meta).toEqual({ a: 1, b: 'plain', c: [true, null] });
  });

  it('control: a token the simulator does not model is kept as written', () => {
    const vars = runAssignment({ when: '{NOW()}' });
    expect(vars.when).toBe('{NOW()}');
  });
});
