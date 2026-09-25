// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * FlowSimulator — a deterministic, backend-free interpreter that walks a flow
 * draft for designer-time debugging. See `flow-sim-types.ts` for the contract.
 *
 * Supported faithfully: start, decision (its `config.conditions` branch and
 * CEL-guarded out-edges), the CRUD / get / http / connector /
 * script(notification|code) side-effects (MOCKED), and end. Every node leaves
 * by the same successor selection, the runtime's `traverseNext` (see
 * {@link FlowSimulator.route}). `wait`, `screen`, and `approval` PAUSE for manual continuation (an approval
 * resumes down the chosen decision's branch — approve / reject / revise). `loop` resolves its
 * collection and exposes the iterator but is a labelled single pass (the edge
 * model has no separate body/exit edge). `parallel_gateway` fans out WITHOUT
 * join synchronization; the ADR-0031 structured containers (`parallel`,
 * `try_catch` — nested body regions), `join_gateway`, `subflow` and
 * `boundary_event` are marked unsupported rather than faked. Fault edges are
 * not modelled: a node that fails stops the run, and a `fault` edge is never
 * walked as an ordinary successor. A hard step ceiling guards cycles.
 */

import { isExpressionEnvelopeShaped } from '@objectstack/spec/automation';
import type {
  MockResults,
  SimEdge,
  SimEdgeEval,
  SimNode,
  SimState,
  SimStep,
  SimStepStatus,
} from './flow-sim-types.js';
import { evalBranchPredicate, evalGuard, evalValueEnvelope, validateFlowDraft } from './flow-sim-validate.js';
import { conditionText } from '../flow-canvas-layout.js';
import { unevaluableVisibleWhen } from '../screen-spec.js';
import { isValueEnvelopeSlot } from '../../inspectors/flow-value-envelope.js';

const MAX_STEPS = 500;

/**
 * The branch a decision reports when none of its `config.conditions` matched:
 * the runtime's `DEFAULT_BRANCH_LABEL` (`@objectstack/service-automation`),
 * which the spec does not export. An out-edge labelled so, or failing that the
 * `isDefault` edge, claims it.
 */
const DEFAULT_BRANCH_LABEL = 'default';

/** A branch label that narrows a node's out-edges (see {@link FlowSimulator.route}). */
interface BranchSelection {
  label: string;
  /** Whether an out-edge's `label` claims this branch. */
  claims: (edgeLabel: string | undefined) => boolean;
}

/** What successor selection did with one node's out-edges. */
interface Routing {
  /** Every out-edge it considered, in bucket order: guarded, default, unguarded. */
  evals: SimEdgeEval[];
  /** A guard was refused or failed: no out-edge is taken and the run stops. */
  error?: string;
  /** At least one considered out-edge carries a guard or `isDefault`. */
  gated: boolean;
  note?: string;
}

/** Join the non-empty notes of one step. */
const joinNotes = (...notes: Array<string | undefined>): string | undefined =>
  notes.filter((n): n is string => !!n).join(' ') || undefined;

const PASS_THROUGH = new Set(['start']);
const MOCKED_SIDE_EFFECT = new Set([
  'create_record',
  'update_record',
  'delete_record',
  'get_record',
  'http_request',
  'connector_action',
]);
// `parallel` / `try_catch` carry nested body regions (ADR-0031) the flat
// stepper can't walk — pass through honestly instead of faking their semantics.
const UNSUPPORTED = new Set(['join_gateway', 'subflow', 'boundary_event', 'parallel', 'try_catch']);

const edgeId = (e: SimEdge, i: number): string => e.id || `${e.source}->${e.target}#${i}`;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);

/** A variable path the runtime's `resolveToken` looks up: `a`, `a.b`, `list.0`. */
const VARIABLE_PATH = /^[A-Za-z_$][\w$]*(?:\.(?:[A-Za-z_$][\w$]*|\d+))*$/;

/** The runtime's `resolvePath`: walk `path`, `undefined` past a non-object. */
function resolvePath(base: unknown, path: string[]): unknown {
  let cur: unknown = base;
  for (const seg of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** The runtime's `stringifyForTemplate`: a token's text inside a longer string. */
function stringifyForTemplate(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export class FlowSimulator {
  private nodes = new Map<string, SimNode>();
  private edges: SimEdge[] = [];
  private mocks: MockResults = {};
  private seq = 0;

  state: SimState = {
    status: 'idle',
    variables: {},
    steps: [],
    frontier: [],
    activeNodeId: null,
    visitedNodeIds: [],
    traversedEdgeIds: [],
  };

  private readonly locale?: string;

  constructor(nodes: SimNode[], edges: SimEdge[], locale?: string) {
    for (const n of nodes) this.nodes.set(n.id, n);
    this.edges = edges;
    this.locale = locale;
  }

  /** Validate + seed variables and queue the entry node. Returns the validation. */
  reset(seedVariables: Record<string, unknown> = {}, mocks: MockResults = {}) {
    const validation = validateFlowDraft([...this.nodes.values()], this.edges, this.locale);
    this.mocks = mocks;
    this.seq = 0;
    this.state = {
      status: validation.errors.length ? 'error' : 'idle',
      variables: { ...seedVariables },
      steps: [],
      frontier: validation.startNodeId ? [validation.startNodeId] : [],
      activeNodeId: null,
      visitedNodeIds: [],
      traversedEdgeIds: [],
      error: validation.errors.length ? validation.errors[0].message : undefined,
    };
    return validation;
  }

  get done(): boolean {
    return this.state.status === 'done' || this.state.status === 'error';
  }

  /** Execute one queued node. Returns the recorded step, or null when idle. */
  step(): SimStep | null {
    const s = this.state;
    if (s.status === 'error' || s.status === 'done' || s.status === 'paused') return null;
    if (this.seq >= MAX_STEPS) {
      s.status = 'error';
      s.error = `Step limit (${MAX_STEPS}) exceeded — the flow may contain an infinite loop.`;
      return null;
    }
    const nodeId = s.frontier.shift();
    if (!nodeId) {
      s.status = 'done';
      s.activeNodeId = null;
      return null;
    }
    const node = this.nodes.get(nodeId);
    if (!node) {
      return this.record(nodeId, 'unknown', nodeId, 'error', { error: `Node "${nodeId}" not found.` });
    }
    s.status = 'running';
    s.activeNodeId = nodeId;
    if (!s.visitedNodeIds.includes(nodeId)) s.visitedNodeIds.push(nodeId);

    const step = this.execute(node);
    // Settle the run status. A pause halts the queue until resume(); a decision
    // dead-end / missing node already set 'error' inside execute(). Only a still
    // -'running' branch that drained the frontier completes as 'done'.
    if (s.status === 'running' && s.frontier.length === 0) {
      s.status = 'done';
      s.activeNodeId = null;
    }
    return step;
  }

  /** Run to completion (or until a pause / error). */
  runToEnd(): SimState {
    let guard = 0;
    while (this.state.status !== 'done' && this.state.status !== 'error' && this.state.status !== 'paused') {
      if (++guard > MAX_STEPS + 5) break;
      this.step();
    }
    return this.state;
  }

  /**
   * Continue a flow paused on a `wait`, `screen`, or `approval` node.
   *  - `screenOutputs` — inputs captured from a paused screen.
   *  - `decision` — the branch an approval resumes down (ADR-0019/0044:
   *    `approve` / `reject` / `revise`). The run takes ONLY the out-edge whose
   *    label matches, mirroring how the engine resumes a suspended approval by
   *    branch label — instead of fanning out to every out-edge.
   */
  resume(opts: { screenOutputs?: Record<string, unknown>; decision?: string } = {}) {
    const s = this.state;
    if (s.status !== 'paused' || !s.activeNodeId) return;
    const node = this.nodes.get(s.activeNodeId);
    if (opts.screenOutputs && node?.type === 'screen') {
      Object.assign(s.variables, opts.screenOutputs);
    }
    s.pausedReason = undefined;
    s.status = 'running';
    if (node?.type === 'approval') this.resumeApproval(node, opts.decision);
    else if (node) {
      const routing = this.route(node);
      // A step only when leaving says something: a guard, a default, an error.
      if (routing.gated || routing.error) {
        this.record(node.id, node.type, node.label, routing.error ? 'error' : 'ok', {
          edges: routing.evals,
          error: routing.error,
          note: joinNotes('Resumed.', routing.note),
        });
      }
    }
    if (s.status === 'running' && s.frontier.length === 0) {
      s.status = 'done';
      s.activeNodeId = null;
    }
  }

  /**
   * Resume a suspended approval down the chosen decision's branch: the
   * out-edges whose `label` equals `decision` (case-insensitive — `approve` /
   * `reject` / `revise`), as the runtime's resume narrows `traverseNext` to
   * the decision's branch label. With no match it considers every out-edge —
   * the engine's unmatched-`branchLabel` fallback — and says so, so the author
   * notices the unrouted decision. Either way the chosen edges go through the
   * same successor selection as every node ({@link route}).
   */
  private resumeApproval(node: SimNode, decision?: string) {
    const want = (decision ?? '').trim();
    const routing = this.route(
      node,
      want
        ? { label: want, claims: (l) => (l ?? '').trim().toLowerCase() === want.toLowerCase() }
        : undefined,
    );
    const taken = routing.evals.filter((x) => x.selected).map((x) => x.target);
    this.record(node.id, 'approval', node.label, routing.error ? 'error' : 'ok', {
      edges: routing.gated || routing.error ? routing.evals : undefined,
      error: routing.error,
      note: joinNotes(
        want
          ? `Decision: ${decision} → ${taken.length ? taken.join(', ') : 'no out-edge taken'}.`
          : 'No decision supplied; every out-edge is considered.',
        routing.note,
      ),
    });
  }

  // ---- node execution -----------------------------------------------------

  private execute(node: SimNode): SimStep {
    const type = node.type;

    if (type === 'end') {
      // Terminate this branch only; other queued branches still run.
      return this.record(node.id, type, node.label, 'ok', { note: 'Flow end reached.' });
    }

    if (type === 'decision') return this.executeDecision(node);

    if (type === 'assignment') return this.executeAssignment(node);

    if (UNSUPPORTED.has(type)) {
      return this.proceed(node, 'skipped', {
        note: `"${type}" is not modelled by the simulator; passing through without its real semantics.`,
      });
    }

    if (type === 'parallel_gateway') {
      return this.proceed(node, 'ok', {
        note: 'Parallel split — branches fan out (no join synchronization is simulated).',
      });
    }

    if (type === 'approval') {
      // ADR-0019: an approval node opens a request and SUSPENDS the run until a
      // decision is recorded. Model that as a pause; the author resumes down the
      // chosen approve / reject / revise out-edge (see resumeApproval) rather
      // than fanning out to every out-edge at once.
      this.state.status = 'paused';
      this.state.pausedReason = 'approval';
      return this.record(node.id, type, node.label, 'paused', { note: 'Approval reached — choose a decision to continue.' });
    }

    if (type === 'wait') {
      this.state.status = 'paused';
      this.state.pausedReason = 'wait';
      return this.record(node.id, type, node.label, 'paused', { note: 'Wait reached — continue manually.' });
    }

    if (type === 'screen') {
      // Mirror the engine's `shouldPause`: a screen suspends only when it
      // collects input (`fields`) or explicitly opts in (`waitForInput`).
      // A field-less / `waitForInput:false` screen is a server pass-through.
      const fields = Array.isArray(node.config?.fields) ? (node.config!.fields as unknown[]) : [];
      const waitForInput = node.config?.waitForInput;
      const shouldPause = waitForInput === true || (fields.length > 0 && waitForInput !== false);
      if (shouldPause) {
        this.state.status = 'paused';
        this.state.pausedReason = 'screen';
        // A field whose `visibleWhen` cannot be evaluated is hidden, as the
        // runtime reads it (`fieldVisibility` in `../screen-spec.ts`); say which.
        const unevaluable = unevaluableVisibleWhen(node, this.state.variables);
        return this.record(node.id, type, node.label, 'paused', {
          note: joinNotes(
            'Screen reached — provide inputs, then continue.',
            unevaluable.length
              ? `Hidden because its visibleWhen could not be evaluated, as the runtime treats such a field: ${unevaluable
                  .map((u) => `"${u.name}" (${u.error.split('\n')[0]})`)
                  .join('; ')}.`
              : undefined,
          ),
        });
      }
      return this.proceed(node, 'ok', { note: 'Screen has no input — passed through (matches runtime).' });
    }

    if (type === 'loop') {
      return this.proceed(node, 'ok', { note: this.executeLoop(node) });
    }

    if (MOCKED_SIDE_EFFECT.has(type) || type === 'script') {
      const wrote = this.applyMock(node);
      return this.proceed(node, 'mocked', {
        wrote,
        note: this.mockNote(node),
      });
    }

    // start / anything else: pass straight through.
    return this.proceed(node, 'ok', {
      note: PASS_THROUGH.has(type) ? undefined : `Type "${type}" treated as pass-through.`,
    });
  }

  /**
   * Record `node`'s step and leave it by {@link route}. A guard that is refused
   * or fails makes the step an error: the runtime throws in `traverseNext`,
   * after the node itself ran, and the run fails there.
   */
  private proceed(node: SimNode, status: SimStepStatus, extra: Partial<SimStep> = {}): SimStep {
    const routing = this.route(node);
    return this.record(node.id, node.type, node.label, routing.error ? 'error' : status, {
      ...extra,
      edges: routing.gated || routing.error ? routing.evals : undefined,
      error: routing.error,
      note: joinNotes(extra.note, routing.note),
    });
  }

  /**
   * A decision routes the way the runtime's `decision` executor and
   * `traverseNext` route it (objectui#10692):
   *
   * - It declares `config.conditions` → the first entry whose `expression` is
   *   true names the branch (its `label`); none true → the branch is
   *   {@link DEFAULT_BRANCH_LABEL}. Each `expression` is CEL, through
   *   `evalBranchPredicate`. The branch narrows the out-edges in {@link route}.
   * - It declares none → there is no branch, and its out-edges route alone,
   *   exactly as any other node's do.
   *
   * A refused or failing `expression` stops the run on the decision: the
   * runtime refuses the flow at `registerFlow`, or throws.
   */
  private executeDecision(node: SimNode): SimStep {
    const branch = this.decisionBranch(node);
    if ('error' in branch) {
      return this.record(node.id, 'decision', node.label, 'error', { error: branch.error });
    }
    const routing = this.route(node, branch.selection);
    const leaves = this.edges.some((e) => e.source === node.id && e.type !== 'fault');
    return this.record(node.id, 'decision', node.label, routing.error ? 'error' : 'ok', {
      edges: routing.evals,
      error: routing.error,
      note: joinNotes(
        branch.note,
        routing.note,
        leaves ? undefined : 'The decision has no out-edge; the runtime ends this branch here.',
      ),
    });
  }

  /** The runtime `decision` executor's branch: see {@link executeDecision}. */
  private decisionBranch(node: SimNode): { selection?: BranchSelection; note?: string } | { error: string } {
    const conditions = node.config?.conditions;
    if (!Array.isArray(conditions) || conditions.length === 0) return {};
    for (const [k, entry] of conditions.entries()) {
      const cond = (entry && typeof entry === 'object' ? entry : {}) as { label?: unknown; expression?: unknown };
      const g = evalBranchPredicate(cond.expression, this.state.variables);
      if (g.kind === 'fault') return { error: `config.conditions[${k}].expression: ${g.error}` };
      if (!g.result) continue;
      // An empty label is no branch at all (the runtime's `if (branchLabel)`).
      const label = typeof cond.label === 'string' && cond.label ? cond.label : undefined;
      return label
        ? { selection: { label, claims: (l) => l === label }, note: `Branch "${label}" matched (config.conditions).` }
        : {};
    }
    return {
      selection: { label: DEFAULT_BRANCH_LABEL, claims: (l) => l === DEFAULT_BRANCH_LABEL },
      note: `No entry of config.conditions matched; the branch is "${DEFAULT_BRANCH_LABEL}".`,
    };
  }

  /**
   * assignment node — set flow variables. Normalizes the three authoring
   * shapes the engine accepts (Studio's `{ assignments: { var: value } }`
   * map, the example `{ assignments: [{ variable, value }] }` array, and the
   * legacy flat `{ var: value }`) and interpolates `{var}` templates — so the
   * Debug run mirrors runtime instead of silently no-oping.
   *
   * A CEL value envelope `{ dialect: 'cel', source }` is evaluated, the way the
   * runtime's assignment executor evaluates it (objectui#10537). That applies
   * only in the map: the spec's expression ledger names `assignments.*` as the
   * `value` slot (`isValueEnvelopeSlot`), and an object naming a `dialect`
   * there is an envelope (`isExpressionEnvelopeShaped`, the executor's own
   * test). In both legacy shapes an envelope-shaped object stays the literal
   * object it always was, as it does at runtime.
   *
   * Pairs run in order against the live variables, so an envelope sees the
   * earlier writes of the same node. An envelope that fails (malformed, or a
   * CEL error) is not written: the step reports the error and the run stops
   * there, because the runtime throws on it and fails the node. The pairs
   * before it stay written, as at runtime.
   */
  private executeAssignment(node: SimNode): SimStep {
    const cfg = node.config ?? {};
    const raw = cfg.assignments;
    // `slot` = the pair sits in the ledger's `value` slot, where an envelope is
    // an expression. False for both legacy shapes.
    const pairs: Array<{ key: string; value: unknown; slot: boolean }> = [];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (item && typeof item === 'object') {
          const e = item as Record<string, unknown>;
          const name = e.variable ?? e.name ?? e.key;
          if (typeof name === 'string' && name) pairs.push({ key: name, value: e.value, slot: false });
        }
      }
    } else if (raw && typeof raw === 'object') {
      const slot = isValueEnvelopeSlot(node.type, ['config', 'assignments']);
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) pairs.push({ key: k, value: v, slot });
    } else {
      for (const [k, v] of Object.entries(cfg)) pairs.push({ key: k, value: v, slot: false });
    }
    const wrote: Record<string, unknown> = {};
    // `{token}`s kept as written because they are not modelled (see
    // `interpolateString`), named on the step so the value is not mistaken
    // for the runtime's.
    const unmodelled: string[] = [];
    for (const { key, value, slot } of pairs) {
      let resolved: unknown;
      if (slot && isExpressionEnvelopeShaped(value)) {
        const evaluated = evalValueEnvelope(value, this.state.variables);
        if (!evaluated.ok) {
          return this.record(node.id, 'assignment', node.label, 'error', {
            wrote: Object.keys(wrote).length ? wrote : undefined,
            error: `assignments.${key}: ${evaluated.error}`,
          });
        }
        resolved = evaluated.value;
      } else {
        const tokens: string[] = [];
        resolved = this.interpolateValue(value, tokens);
        for (const t of tokens) unmodelled.push(`${t} in "${key}"`);
      }
      this.state.variables[key] = resolved;
      wrote[key] = resolved;
    }
    return this.proceed(node, 'ok', {
      wrote: Object.keys(wrote).length ? wrote : undefined,
      note: joinNotes(
        Object.keys(wrote).length ? undefined : 'No assignments defined.',
        unmodelled.length
          ? `Kept as written, not modelled by the Debug run: ${unmodelled.join(', ')}. ` +
              'The runtime resolves these tokens itself (NOW() / TODAY(), $User.*, arithmetic, function calls).'
          : undefined,
      ),
    });
  }

  /**
   * Resolve `{var}` templates in an assignment value against live variables,
   * following the runtime's `interpolate` (`builtin/template.ts` in
   * `@objectstack/service-automation`) rule for rule (objectui#10615):
   *
   * - An array or a plain object is walked into a new one: every element and
   *   every property value is interpolated. Keys are not.
   * - Any other non-string (number, boolean, `null`) is returned unchanged.
   * - A string with no `{` is returned unchanged.
   * - A string that is one whole token (`'{n}'`) takes the token's value, type
   *   kept. A token naming nothing gives `undefined`.
   * - Tokens inside a longer string become text: `null` and `undefined` give
   *   `''`, and an object or array gives its JSON.
   *
   * A token is resolved by {@link resolveToken}, which models the runtime's
   * variable-path lookup only. A token it does not model is kept as written,
   * whole or inside a longer string, and pushed onto `unmodelled` so the step
   * can name it (objectui#10692): the runtime renders a value there, which the
   * Debug run cannot produce, so it shows the token rather than a fake value.
   */
  private interpolateValue(value: unknown, unmodelled: string[]): unknown {
    if (typeof value === 'string') return this.interpolateString(value, unmodelled);
    if (Array.isArray(value)) return value.map((v) => this.interpolateValue(v, unmodelled));
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = this.interpolateValue(v, unmodelled);
      return out;
    }
    return value;
  }

  private interpolateString(input: string, unmodelled: string[]): unknown {
    if (!input.includes('{')) return input;
    const whole = /^\{([^{}]+)\}$/.exec(input);
    if (whole) {
      const token = this.resolveToken(whole[1]);
      if (token.modelled) return token.value;
      unmodelled.push(input);
      return input;
    }
    return input.replace(/\{([^{}]+)\}/g, (m: string, expr: string) => {
      const token = this.resolveToken(expr);
      if (token.modelled) return stringifyForTemplate(token.value);
      unmodelled.push(m);
      return m;
    });
  }

  /**
   * Resolve one `{…}` token the way the runtime's `resolveToken` resolves a
   * variable path: `a.b.0` reads variable `a`, then walks `b` and index `0`;
   * with no variable `a`, it reads a variable whose key is the whole dotted
   * text. A path that reaches nothing is `undefined`.
   *
   * The runtime's other token forms are not modelled: `NOW()` / `TODAY()`,
   * `$User.*`, function calls and arithmetic. They come back unmodelled, and
   * `interpolateString` keeps them as written.
   */
  private resolveToken(token: string): { modelled: true; value: unknown } | { modelled: false } {
    const trimmed = token.trim();
    if (!trimmed) return { modelled: true, value: undefined };
    if (trimmed.startsWith('$User.') || !VARIABLE_PATH.test(trimmed)) return { modelled: false };
    const vars = this.state.variables;
    const [head, ...path] = trimmed.split('.');
    if (Object.prototype.hasOwnProperty.call(vars, head)) return { modelled: true, value: resolvePath(vars[head], path) };
    return { modelled: true, value: Object.prototype.hasOwnProperty.call(vars, trimmed) ? vars[trimmed] : undefined };
  }

  /** Resolve a loop's collection and bind its iterator; returns the step's note. */
  private executeLoop(node: SimNode): string {
    const ref = str(node.config?.collection);
    const iterVar = str(node.config?.iteratorVariable);
    let note = 'Loop simulated as a single pass (body re-execution is not modelled).';
    if (ref) {
      const resolved = this.resolveRef(ref);
      if (Array.isArray(resolved)) {
        note = `Collection "${ref}" has ${resolved.length} item(s); simulated as a single pass.`;
        if (iterVar && resolved.length) this.state.variables[iterVar] = resolved[0];
      } else if (resolved !== undefined) {
        note = `Collection "${ref}" is not an array; loop may not run at runtime.`;
      }
    }
    return note;
  }

  // ---- helpers ------------------------------------------------------------

  /** Resolve a `{var}` template ref or a plain variable name from `variables`. */
  private resolveRef(ref: string): unknown {
    const m = ref.match(/^\{(.+)\}$/);
    const key = (m ? m[1] : ref).trim();
    return this.state.variables[key];
  }

  /**
   * Apply a node's mock output to the simulation variables; returns what it
   * wrote. Only the singular `outputVariable` binds — the script node's legacy
   * `outputVariables` list is deliberately ignored, because the engine never
   * binds those names (framework#4278); simulating them taught authors a
   * binding that does not exist at run time.
   */
  private applyMock(node: SimNode): Record<string, unknown> | undefined {
    const cfg = node.config ?? {};
    const mock = this.mocks[node.id];
    const wrote: Record<string, unknown> = {};

    const single = str(cfg.outputVariable);
    if (single) {
      wrote[single] = mock !== undefined ? mock : {};
      this.state.variables[single] = wrote[single];
    }
    return Object.keys(wrote).length ? wrote : undefined;
  }

  private mockNote(node: SimNode): string {
    if (node.type === 'script') {
      // A script node calls a registered function and nothing else
      // (framework#4343) — the branches below describe a stored node that has
      // not been migrated yet, and say plainly that they never ran.
      const fn = str(node.config?.function);
      if (fn) return `Mocked call to '${fn}' (no function executed).`;
      const action = str(node.config?.actionType);
      if (action && action !== 'code') {
        return `Retired '${action}' action — it never delivered anything; use a notify node (or a connector for Slack).`;
      }
      return 'Retired inline script — the runtime never executed it; move the logic into a registered function.';
    }
    return `Mocked ${node.type.replace(/_/g, ' ')} (no backend call).`;
  }

  /**
   * Successor selection — the runtime's `traverseNext` (`AutomationEngine` in
   * `@objectstack/service-automation`), one path for every node kind
   * (objectui#10692). It has no rule of its own for a node type: the one input
   * that differs is a branch label, which a decision reports from its
   * `config.conditions` and an approval from the decision it resumes with.
   *
   * 1. A `fault` edge is never a successor. (What a fault edge does when a node
   *    fails is not modelled: the simulator stops the run there.)
   * 2. A branch label narrows the out-edges to the ones whose `label` claims
   *    it; {@link DEFAULT_BRANCH_LABEL} is claimed by the `isDefault` edge too.
   *    No out-edge claims it → every out-edge is considered, as the runtime
   *    does (it logs a warning), and the step says so.
   * 3. An edge with a `condition` is GUARDED, `isDefault` or not (the
   *    condition wins, as at runtime; the linter flags the pair). Guards are
   *    evaluated in declared order through `evalGuard`. The first true one is
   *    taken. The runtime takes every true one: objectstack#15429 is pending,
   *    and until it rules the Debug run keeps first-true, as it always has.
   *    A refused or failing guard takes nothing and fails the run.
   * 4. An `isDefault` edge with no condition is taken only when no guard was
   *    true.
   * 5. Every other edge is UNGUARDED and always taken.
   * 6. Nothing taken → the branch ends here. The runtime ends it too, with
   *    no error; the step says so.
   *
   * Only an omitted `condition` (`undefined`) is "no condition"; any other
   * value is a guard for `evalGuard` to evaluate or refuse (objectui#10615).
   */
  private route(node: SimNode, branch?: BranchSelection): Routing {
    const vars = this.state.variables;
    const out = this.edges
      .map((e, i) => ({ e, i }))
      .filter((x) => x.e.source === node.id && x.e.type !== 'fault');
    const notes: string[] = [];
    let considered = out;
    if (branch) {
      let claimed = out.filter((x) => branch.claims(x.e.label));
      if (claimed.length === 0 && branch.label === DEFAULT_BRANCH_LABEL) claimed = out.filter((x) => x.e.isDefault === true);
      if (claimed.length > 0) considered = claimed;
      else {
        notes.push(
          `No out-edge carries the branch label "${branch.label}", so every out-edge is considered, as the runtime does (it logs a warning).`,
        );
      }
    }

    const evals: SimEdgeEval[] = [];
    const taken: Array<{ e: SimEdge; i: number }> = [];
    let gated = false;
    let trueGuards = 0;
    for (const { e, i } of considered) {
      if (e.condition === undefined) continue;
      gated = true;
      const cond = conditionText(e.condition);
      const g = evalGuard(e.condition, vars);
      if (g.kind !== 'value') {
        const error = g.kind === 'fault' ? g.error : 'Evaluation failed.';
        evals.push({ edgeId: edgeId(e, i), target: e.target, condition: cond, result: false, error, selected: false });
        return { evals, gated, error: cond ? `${cond}: ${error}` : error };
      }
      const selected = g.result && trueGuards === 0;
      if (g.result) trueGuards++;
      if (selected) taken.push({ e, i });
      evals.push({ edgeId: edgeId(e, i), target: e.target, condition: cond, result: g.result, selected });
    }
    for (const { e, i } of considered) {
      if (e.condition !== undefined || !e.isDefault) continue;
      gated = true;
      const selected = trueGuards === 0;
      if (selected) taken.push({ e, i });
      evals.push({ edgeId: edgeId(e, i), target: e.target, isDefault: true, result: selected, selected });
    }
    for (const { e, i } of considered) {
      if (e.condition !== undefined || e.isDefault) continue;
      taken.push({ e, i });
      evals.push({ edgeId: edgeId(e, i), target: e.target, result: true, selected: true });
    }

    if (trueGuards > 1) {
      notes.push('Multiple conditions matched; the first declared branch was taken (the runtime takes every match, objectstack#15429).');
    }
    if (considered.length > 0 && taken.length === 0) {
      notes.push('No out-edge was taken: no guard was true and there is no default edge. The runtime ends this branch here.');
    }
    for (const { e, i } of taken) this.traverse(e, i);
    return { evals, gated, note: notes.length ? notes.join(' ') : undefined };
  }

  private traverse(e: SimEdge, i: number) {
    const id = edgeId(e, i);
    if (!this.state.traversedEdgeIds.includes(id)) this.state.traversedEdgeIds.push(id);
    if (this.nodes.has(e.target)) this.state.frontier.push(e.target);
  }

  private record(
    nodeId: string,
    type: string,
    label: string | undefined,
    status: SimStepStatus,
    extra: Partial<SimStep> = {},
  ): SimStep {
    const step: SimStep = { seq: this.seq++, nodeId, type, label: label || nodeId, status, ...extra };
    this.state.steps.push(step);
    if (status === 'error' && this.state.status !== 'paused') {
      this.state.status = 'error';
      this.state.error = extra.error;
    }
    return step;
  }
}
