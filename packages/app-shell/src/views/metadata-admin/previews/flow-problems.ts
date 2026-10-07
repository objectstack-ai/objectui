// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * flow-problems — unify the two flow-validation sources into one flat,
 * per-element issue list that the canvas badges and the Problems panel both
 * render.
 *
 *   1. `validateFlowDraft` (client, structural): no resolvable entry,
 *      unreachable nodes, a decision with no default branch, duplicate node
 *      ids, dangling edges, un-declared cycles — plus, from this module, a
 *      connection drawn more than once ({@link edgeRouteKey}, objectui#11772).
 *   2. The server `_diagnostics` already attached to the layered record
 *      (schema validation), each keyed by a dotted JSON path.
 *
 * "Surfacing, not detection": detection already exists. This module only maps
 * each detected issue onto a concrete canvas element — a node id or a stable
 * edge key — so a badge can sit on the offending element and a Problems-panel
 * row can select + reveal it. Flow-level issues (no specific element) are kept
 * too: listed in the panel, but without a badge.
 */

import { createContext } from 'react';
import { validateFlowDraft } from './simulator/flow-sim-validate.js';
import type { Diagnostic, DiagnosticLevel, SimEdge, SimNode } from './simulator/flow-sim-types.js';
import { conditionText, edgeKey, type FlowDesignerEdge, type FlowDesignerNode } from './flow-canvas-layout.js';
import { flowExpressionProblems } from './flow-expr-problems.js';
import { t, tFormat } from '../i18n.js';
import { uniqueId } from '../inspectors/unique-id.js';

/** What a problem points at on the canvas — drives badge placement + reveal. */
export type FlowProblemTarget =
  | { kind: 'node'; nodeId: string }
  | { kind: 'edge'; edgeKey: string; source: string; target: string }
  | { kind: 'flow' };

/** Origin of a problem — labels the panel row and lets the UI group counts. */
export type FlowProblemSource = 'structural' | 'server' | 'expression';

/** One actionable issue, resolved onto a concrete canvas element. */
export interface FlowProblem {
  /** Stable-enough key for React lists. */
  id: string;
  level: DiagnosticLevel;
  message: string;
  target: FlowProblemTarget;
  source: FlowProblemSource;
  /**
   * Extra elements to flag with the red error ring/stroke beyond `target` —
   * e.g. every hop of a cycle. The badge + click-reveal still use `target`.
   */
  highlight?: { nodeIds: string[]; edges: Array<{ source: string; target: string }> };
}

/** A server diagnostic entry (subset of the layered record's `_diagnostics`). */
export interface ServerDiagnostic {
  /** Dotted (or array) JSON path, e.g. `nodes.2.config.objectName`. */
  path?: string | Array<string | number>;
  message: string;
  /** Defaults to `'error'`. */
  severity?: DiagnosticLevel;
}

/** Stable `source->target` key matching an edge problem to a rendered edge. */
export function edgeProblemKey(source: string, target: string): string {
  return `${source}->${target}`;
}

/**
 * What makes two edges the SAME connection (objectui#11772): the same
 * `source → target` taken the same way — the same `type` (the spec's default
 * is `'default'`), the same guard (read through `conditionText`, so a bare
 * string and its `{ dialect, source }` envelope agree), the same default-branch
 * flag and the same `label`. The id is not part of it: ids are what tell the
 * copies apart.
 *
 * Two such edges are one connection drawn twice, and the engine follows each
 * of them, so the target runs once per copy — the card's published flow held
 * `start → node_1` three times and created three records for one update.
 *
 * Deliberately narrower than "the same pair of nodes": two edges joining the
 * same nodes DIFFERENTLY are a legitimate shape — an exclusive decision whose
 * `a > 1` and `else` branches both lead to one node, or an approval whose
 * `approve` and `reject` labels both do — and stay unflagged.
 *
 * One key for both of its readers: the Problems check below, and the node
 * removal at the foot of this module (`edgesAfterNodeRemoval`), which never
 * reconnects into a connection that already exists — so removing a node
 * cannot draw the repeat this module flags.
 */
export function edgeRouteKey(edge: FlowDesignerEdge): string {
  return JSON.stringify([
    edge.source,
    edge.target,
    edge.type ?? 'default',
    conditionText(edge.condition) ?? '',
    edge.isDefault === true,
    edge.label ?? '',
  ]);
}

/**
 * One error per extra copy of a connection ({@link edgeRouteKey}); the first
 * copy is the connection and draws nothing. Each row targets its OWN copy by
 * its own `edgeKey`, so clicking it selects exactly the edge to remove in the
 * edge inspector — the repair path for a flow already saved with repeats (no
 * stored flow is rewritten for the author).
 */
function repeatedEdgeProblems(edges: FlowDesignerEdge[], locale?: string): FlowProblem[] {
  const seen = new Set<string>();
  const out: FlowProblem[] = [];
  edges.forEach((edge, index) => {
    const route = edgeRouteKey(edge);
    if (!seen.has(route)) {
      seen.add(route);
      return;
    }
    const target: FlowProblemTarget = { kind: 'edge', source: edge.source, target: edge.target, edgeKey: edgeKey(edge, index) };
    out.push({
      id: `structural:error:repeated:${index}:${targetKey(target)}`,
      level: 'error',
      message: tFormat('engine.flowProblems.repeatedEdge', locale, { source: edge.source, target: edge.target }),
      target,
      source: 'structural',
    });
  });
  return out;
}

/** Resolve an edge's selection key (`edgeKey`) from its endpoints. */
function resolveEdgeKey(edges: FlowDesignerEdge[], source: string, target: string): string {
  const idx = edges.findIndex((e) => e.source === source && e.target === target);
  return idx >= 0 ? edgeKey(edges[idx], idx) : `${source}->${target}#-1`;
}

/** Normalize a dotted/array JSON path to segments (numbers stay numeric). */
function pathSegments(path: ServerDiagnostic['path']): Array<string | number> {
  if (Array.isArray(path)) return path;
  if (typeof path !== 'string' || !path) return [];
  return path.split('.').map((seg) => {
    const n = Number(seg);
    return Number.isInteger(n) && String(n) === seg ? n : seg;
  });
}

/** A structural diagnostic mapped to its badge target + optional red-highlight set. */
interface StructuralMapping {
  target: FlowProblemTarget;
  highlight?: { nodeIds: string[]; edges: Array<{ source: string; target: string }> };
}

/**
 * Map a structural diagnostic's optional anchors (`edge`, `cycle`, `nodeId`)
 * onto a badge target. A cycle points its badge at the *closing* hop — the edge
 * the author marks as a back-edge to resolve it — but flags EVERY hop (nodes +
 * edges) for the red error highlight so the whole loop reads as the problem.
 */
function structuralMapping(diag: Diagnostic, edges: FlowDesignerEdge[]): StructuralMapping {
  if (diag.edge) {
    const { source, target } = diag.edge;
    return { target: { kind: 'edge', source, target, edgeKey: resolveEdgeKey(edges, source, target) } };
  }
  if (diag.cycle && diag.cycle.length >= 2) {
    const c = diag.cycle;
    const source = c[c.length - 2];
    const target = c[c.length - 1];
    const nodeIds: string[] = [];
    const hops: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < c.length - 1; i++) {
      nodeIds.push(c[i]);
      hops.push({ source: c[i], target: c[i + 1] });
    }
    return {
      target: { kind: 'edge', source, target, edgeKey: resolveEdgeKey(edges, source, target) },
      highlight: { nodeIds, edges: hops },
    };
  }
  if (diag.nodeId) return { target: { kind: 'node', nodeId: diag.nodeId } };
  return { target: { kind: 'flow' } };
}

/** Map a server diagnostic's JSON path onto a node/edge/flow target. */
function serverTarget(path: ServerDiagnostic['path'], nodes: FlowDesignerNode[], edges: FlowDesignerEdge[]): FlowProblemTarget {
  const segs = pathSegments(path);
  if (segs.length >= 2 && typeof segs[1] === 'number') {
    const idx = segs[1];
    if (segs[0] === 'nodes' && nodes[idx]?.id) return { kind: 'node', nodeId: nodes[idx].id };
    if (segs[0] === 'edges' && edges[idx]) {
      const e = edges[idx];
      return { kind: 'edge', source: e.source, target: e.target, edgeKey: edgeKey(e, idx) };
    }
  }
  return { kind: 'flow' };
}

/** Short stable token for a target, used in a problem's React key. */
function targetKey(t: FlowProblemTarget): string {
  if (t.kind === 'node') return `n:${t.nodeId}`;
  if (t.kind === 'edge') return `e:${t.source}->${t.target}`;
  return 'flow';
}

export interface BuildFlowProblemsArgs {
  nodes: FlowDesignerNode[];
  edges: FlowDesignerEdge[];
  /** Server `_diagnostics`, flattened to a severity-tagged, path-keyed list. */
  serverDiagnostics?: ServerDiagnostic[];
  /** Declared flow variables — needed to resolve scope for the expression check. */
  variables?: unknown[];
  /** UI locale for the structural-validation messages. */
  locale?: string;
  /**
   * The runtime connector registry (`GET /api/v1/automation/connectors`,
   * unwrapped to the connector array), handed to the expression scan so a
   * committed `connector_action` node's declared output keys are in scope
   * downstream (objectui#11085). A host reads it as the inspectors do —
   * `useConnectorRegistry(hasCommittedConnectorAction(draft))` — so a flow with
   * no such node never fetches. Omitted, those references are reported as not
   * in scope.
   */
  connectors?: unknown;
}

/**
 * Build the unified problem list from structural validation + server
 * diagnostics. Errors are listed before warnings; within a level each source
 * keeps its own emit order (structural before server).
 */
export function buildFlowProblems({ nodes, edges, serverDiagnostics, variables, locale, connectors }: BuildFlowProblemsArgs): FlowProblem[] {
  const problems: FlowProblem[] = [];

  const v = validateFlowDraft(nodes as unknown as SimNode[], edges as unknown as SimEdge[], locale);
  const pushStructural = (level: DiagnosticLevel, list: Diagnostic[]) => {
    list.forEach((diag, i) => {
      const { target, highlight } = structuralMapping(diag, edges);
      problems.push({
        id: `structural:${level}:${i}:${targetKey(target)}`,
        level,
        message: diag.message,
        target,
        source: 'structural',
        ...(highlight ? { highlight } : {}),
      });
    });
  };
  pushStructural('error', v.errors);
  problems.push(...repeatedEdgeProblems(edges, locale));
  pushStructural('warning', v.warnings);

  (serverDiagnostics ?? []).forEach((diag, i) => {
    const level: DiagnosticLevel = diag.severity === 'warning' ? 'warning' : 'error';
    const target = serverTarget(diag.path, nodes, edges);
    problems.push({
      id: `server:${i}:${targetKey(target)}`,
      level,
      message: diag.message,
      target,
      source: 'server',
    });
  });

  // Client-side EXPRESSION issues (ADR-0032 braces + scope-aware unknown refs),
  // resolved onto node / edge targets — see flow-expr-problems.
  flowExpressionProblems({ nodes, edges, variables: variables ?? [] }, locale, connectors).forEach((ep, i) => {
    const target: FlowProblemTarget =
      ep.target.kind === 'edge'
        ? {
            kind: 'edge',
            source: ep.target.source,
            target: ep.target.target,
            edgeKey: resolveEdgeKey(edges, ep.target.source, ep.target.target),
          }
        : { kind: 'node', nodeId: ep.target.nodeId };
    problems.push({
      id: `expression:${ep.level}:${i}:${targetKey(target)}`,
      level: ep.level,
      message: ep.message,
      target,
      source: 'expression',
    });
  });

  // Errors first so the panel + counts lead with blockers (stable within level).
  return problems
    .map((p, i) => [p, i] as const)
    .sort((a, b) => {
      if (a[0].level !== b[0].level) return a[0].level === 'error' ? -1 : 1;
      return a[1] - b[1];
    })
    .map(([p]) => p);
}

// ── The flow's run status (objectui#11779) ─────────────────────────────────
//
// One derivation, three readers: the Automations rail's status chip
// (`FlowStatusDot`), the flow header's Status pill (`FlowPreview`) and the
// Problems panel's note (`ProblemsPanel`). Each used to read something of its
// own: the rail the engine's runtime row, the header the draft's persisted
// `status` (an absent key read as "draft", although the engine arms a draft
// flow exactly like an active one), the panel nothing at all. So one flow could
// read On in the rail, draft in the header and "no problems" in the panel while
// the deployment never ran it.
//
// It lives here, beside the problem list, because this module is the
// component-free home the preview and the panel already share; the host that
// reads `_status` imports it from here too, so the host takes on none of the
// preview's canvas to hand it a row.

/**
 * One flow's runtime row as Studio keeps it: the engine's `FlowRuntimeState`
 * from `GET /api/v1/automation/_status`, narrowed by the host that read it
 * (`flowRailState` in the Studio surface) — `enabled` / `bound`, plus
 * `triggerType` and `reason` only as non-empty strings (objectui#11281).
 */
export interface FlowRuntimeRow {
  enabled: boolean;
  bound: boolean;
  /**
   * The flow's declared trigger type. Absent when the flow declares no trigger
   * (the engine omits the field then), and on a backend that never sends it.
   */
  triggerType?: string;
  /**
   * The platform's sentence for why this flow is not armed. RENDERED verbatim,
   * ⛔ never parsed, compared or restyled (the contract: "Consumers RENDER it;
   * ⛔ do not parse it").
   */
  reason?: string;
}

/**
 * What one flow's state reads as, everywhere Studio shows it.
 *
 * From a runtime row (the engine's answer):
 *   - `on` — enabled and bound to its declared trigger;
 *   - `manual` — enabled, and declares no trigger: it runs when something
 *     invokes it, so it is never called "not running";
 *   - `not-running` — enabled, declares a trigger, and that trigger is not
 *     armed on this deployment (`bound: false` with a `triggerType`: the
 *     contract's "declared trigger type has no registered trigger", or a
 *     deployment policy). `reason` is the platform's sentence when it sent one;
 *   - `off` — disabled: registered, and never runs.
 * Without one:
 *   - `unpublished` — the host read `_status` and the engine has no row for
 *     this flow: nothing of it is deployed;
 *   - `enabled` / `disabled` — no runtime reading at all (no host that reads
 *     `_status`, a backend without the route, offline): only the draft's own
 *     switch can be read, the way the engine reads it — `obsolete` / `invalid`
 *     off, anything else (`active`, `draft`, no key) on.
 */
export type FlowRunStatus =
  | { kind: 'on' }
  | { kind: 'manual' }
  | { kind: 'not-running'; reason?: string }
  | { kind: 'off' }
  | { kind: 'unpublished' }
  | { kind: 'enabled' }
  | { kind: 'disabled' };

/**
 * Derive a flow's {@link FlowRunStatus}.
 *
 * @param runtime the flow's runtime row; `null` when the host read `_status`
 *   and the engine has no row for the flow; `undefined` when there is no
 *   runtime reading to consult.
 * @param draftStatus the draft's persisted `status`, read only when `runtime`
 *   is `undefined`.
 */
export function deriveFlowRunStatus(runtime: FlowRuntimeRow | null | undefined, draftStatus?: unknown): FlowRunStatus {
  if (runtime === undefined) {
    return draftStatus === 'obsolete' || draftStatus === 'invalid' ? { kind: 'disabled' } : { kind: 'enabled' };
  }
  if (runtime === null) return { kind: 'unpublished' };
  if (!runtime.enabled) return { kind: 'off' };
  if (runtime.bound) return { kind: 'on' };
  if (!runtime.triggerType) return { kind: 'manual' };
  return runtime.reason ? { kind: 'not-running', reason: runtime.reason } : { kind: 'not-running' };
}

/**
 * The open flow's runtime row, handed from a host that read
 * `GET /api/v1/automation/_status` (Studio's Automations pillar) to the flow
 * preview it renders, which derives the header's Status pill and the Problems
 * panel's note from it with {@link deriveFlowRunStatus} — the derivation the
 * host's rail reads.
 *
 *   - a row: the engine's answer for this flow;
 *   - `null`: the host read `_status` and the engine has no row for this flow;
 *   - `undefined` (the default, no provider): no runtime reading at all.
 *
 * A context rather than a preview prop because `MetadataPreviewProps` is the
 * package's published preview contract, and this row is one host's hand-off to
 * one preview.
 */
export const FlowRuntimeContext = createContext<FlowRuntimeRow | null | undefined>(undefined);

/** How a {@link FlowRunStatus} reads: the visible words, the hover text, and a tone. */
export interface FlowRunStatusView {
  label: string;
  title?: string;
  /** `plain` is ordinary foreground text; nothing here is styled as an error. */
  tone: 'green' | 'muted' | 'amber' | 'plain';
}

/**
 * The words for a {@link FlowRunStatus}, so the rail, the header and the panel
 * cannot word one state two ways. A platform `reason` is the hover text as
 * sent; every other string is a row of the designer table.
 */
export function describeFlowRunStatus(status: FlowRunStatus, locale?: string): FlowRunStatusView {
  switch (status.kind) {
    case 'on':
      return { label: t('engine.studio.auto.on', locale), title: t('engine.studio.auto.onBound', locale), tone: 'green' };
    case 'manual':
      return { label: t('engine.studio.auto.on', locale), title: t('engine.studio.auto.onUnbound', locale), tone: 'green' };
    case 'not-running':
      return {
        label: t('engine.studio.auto.notRunning', locale),
        title: status.reason ?? t('engine.studio.auto.notRunningTitle', locale),
        tone: 'muted',
      };
    case 'off':
      return { label: t('engine.studio.auto.off', locale), title: t('engine.studio.auto.offTitle', locale), tone: 'muted' };
    case 'unpublished':
      return { label: t('engine.studio.unpublishedDraft', locale), title: t('engine.studio.auto.unpublishedTitle', locale), tone: 'amber' };
    case 'enabled':
      return { label: t('engine.studio.auto.enabled', locale), tone: 'plain' };
    case 'disabled':
      return { label: t('engine.studio.auto.disabled', locale), tone: 'muted' };
  }
}

/** A folded badge for one canvas element (errors dominate warnings). */
export interface ProblemBadge {
  level: DiagnosticLevel;
  /** Tooltip text — each problem message on its own line. */
  title: string;
  count: number;
}

function foldBadge(list: FlowProblem[]): ProblemBadge {
  const level: DiagnosticLevel = list.some((p) => p.level === 'error') ? 'error' : 'warning';
  return { level, title: list.map((p) => p.message).join('\n'), count: list.length };
}

export interface ProblemIndex {
  byNode: Map<string, ProblemBadge>;
  byEdge: Map<string, ProblemBadge>;
}

/** Group problems into per-node / per-edge badges for the canvas overlay. */
export function indexProblemBadges(problems: FlowProblem[]): ProblemIndex {
  const nodeLists = new Map<string, FlowProblem[]>();
  const edgeLists = new Map<string, FlowProblem[]>();
  for (const p of problems) {
    if (p.target.kind === 'node') {
      const l = nodeLists.get(p.target.nodeId) ?? [];
      l.push(p);
      nodeLists.set(p.target.nodeId, l);
    } else if (p.target.kind === 'edge') {
      const k = edgeProblemKey(p.target.source, p.target.target);
      const l = edgeLists.get(k) ?? [];
      l.push(p);
      edgeLists.set(k, l);
    }
  }
  const byNode = new Map<string, ProblemBadge>();
  for (const [id, list] of nodeLists) byNode.set(id, foldBadge(list));
  const byEdge = new Map<string, ProblemBadge>();
  for (const [k, list] of edgeLists) byEdge.set(k, foldBadge(list));
  return { byNode, byEdge };
}

/**
 * Error elements to paint with the red ring/stroke, derived from the unified
 * problem list. ERRORS ONLY — warnings get an amber badge but no ring. Includes
 * each error's `highlight` set, so a cycle paints its whole loop (every hop node
 * + edge) red while its badge still sits on the closing edge. Lets the preview
 * derive the red sets from `problems` instead of a second validateFlowDraft pass.
 */
export function deriveInvalidElements(problems: FlowProblem[]): {
  invalidNodeIds: string[];
  invalidEdges: Set<string>;
} {
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();
  for (const p of problems) {
    if (p.level !== 'error') continue;
    if (p.target.kind === 'node') nodeSet.add(p.target.nodeId);
    else if (p.target.kind === 'edge') edgeSet.add(edgeProblemKey(p.target.source, p.target.target));
    for (const id of p.highlight?.nodeIds ?? []) nodeSet.add(id);
    for (const e of p.highlight?.edges ?? []) edgeSet.add(edgeProblemKey(e.source, e.target));
  }
  return { invalidNodeIds: [...nodeSet], invalidEdges: edgeSet };
}

// ── Edits that cannot draw these problems (objectui#11772) ─────────────────
//
// The designer's own writes must never produce the two edge problems flagged
// above — an edge naming a node that does not exist, and a repeated
// connection — so the two writers that can are here, beside the key they
// share: the id a new node gets, and the edges a node removal keeps. The
// canvas (`FlowCanvas`, `FlowPreview`) and the node inspector import them from
// this component-free module rather than from a component.

/**
 * A fresh node id (objectui#11772): `uniqueId('node', …)` over every id the
 * draft still REFERENCES — the node ids and both endpoints of every edge — plus
 * `retired`, the ids the host's editing session has already seen.
 *
 * Edge endpoints are taken because an edge whose node is gone is a socket the
 * next node with that id plugs into: a flow saved with `start → node_1` and no
 * `node_1` re-attached that edge to whatever the designer named `node_1` next,
 * and the published flow then ran that node once per stale edge. `retired`
 * covers what the draft no longer shows at all — a node removed earlier in the
 * session is never re-minted (see `FlowPreview`).
 *
 * A draft with nothing removed and nothing dangling references only its node
 * ids, so it mints exactly what `uniqueId('node', nodeIds)` minted before.
 * Edge ids keep that plain rule: nothing in a flow refers to an edge by its id
 * (the engine routes by endpoints, guard and label), so a reused edge id
 * cannot re-attach anything.
 */
export function freshNodeId(
  nodes: ReadonlyArray<{ id?: string }>,
  edges: ReadonlyArray<{ source: string; target: string }>,
  retired: Iterable<string> = [],
): string {
  // `uniqueId` skips anything that is not a string; the `?.` keeps a hole in a
  // mid-edit draft from throwing here.
  const taken: Array<string | undefined> = nodes.map((n) => n?.id);
  for (const e of edges) taken.push(e?.source, e?.target);
  for (const id of retired) taken.push(id);
  return uniqueId('node', taken);
}

/** An out-edge that makes no routing choice: unguarded, unlabelled, not the default branch, type `default`. */
function isPlainEdge(edge: FlowDesignerEdge): boolean {
  return (
    edge.condition === undefined &&
    edge.isDefault !== true &&
    !edge.label &&
    (edge.type === undefined || edge.type === 'default')
  );
}

/**
 * The edges a flow keeps when the node `removedId` is removed (objectui#11772)
 * — ONE function for both removal gestures, the node inspector's "Remove
 * node" and the canvas's Delete key (`FlowCanvas`), so the two cannot
 * disagree.
 *
 * Every edge naming the removed node goes with it, in the same patch: an edge
 * left behind names a node that no longer exists, and re-attaches to the next
 * node given that id.
 *
 * A node on a SINGLE PATH is spliced out rather than cut out — its predecessor
 * is reconnected to its successor. Single path, read off the edge shapes:
 *
 *   - exactly one edge in (`P → X`) and exactly one edge out (`X → S`), and
 *     they are not the same (self-loop) edge;
 *   - the edge in is not a declared back-edge — retargeting a loop's closing
 *     hop would change what the loop re-enters;
 *   - the edge out is plain (no guard, no label, not the default branch, type
 *     `default`), so the removed node made no routing choice of its own that
 *     the splice would drop;
 *   - `P` and `S` are other nodes of the flow, and `P ≠ S`;
 *   - no edge already joins `P → S` the same way (`edgeRouteKey`), so the
 *     splice never draws the repeated connection the Problems panel flags.
 *
 * The reconnected edge is the edge in, retargeted — `{ ...in, target: S }`, in
 * the edge in's place. Its id, guard, label, default flag and type are `P`'s
 * routing choice and stay `P`'s: a decision branch that led to the removed
 * node now leads to `S`, at the same position in the declaration order the
 * engine evaluates branches in. That is exactly the inverse of the canvas's
 * `insertOnEdge`, which splits `P → S` into `{ ...edge, target: X }` (in place) and an appended
 * plain `X → S` — so inserting a node on an edge and removing it gives the
 * edges back byte for byte.
 *
 * Anything else — a branch node (several edges out, or a guarded or labelled
 * edge out), a join (several in), a node with no edge in or out — loses its
 * edges and is not reconnected.
 *
 * `remainingNodeIds` are the flow's node ids after the removal. While another
 * node still carries `removedId` (a draft holding a duplicate id, itself a
 * Problems-panel error), the edges are that node's too and are kept as they are.
 */
export function edgesAfterNodeRemoval(
  edges: FlowDesignerEdge[],
  removedId: string,
  remainingNodeIds: ReadonlySet<string>,
): FlowDesignerEdge[] {
  if (remainingNodeIds.has(removedId)) return edges;
  const touches = (e: FlowDesignerEdge) => e.source === removedId || e.target === removedId;
  const kept = edges.filter((e) => !touches(e));
  const incoming = edges.filter((e) => e.target === removedId);
  const outgoing = edges.filter((e) => e.source === removedId);
  if (incoming.length !== 1 || outgoing.length !== 1) return kept;
  const [edgeIn] = incoming;
  const [edgeOut] = outgoing;
  if (edgeIn === edgeOut || edgeIn.type === 'back' || !isPlainEdge(edgeOut)) return kept;
  const predecessor = edgeIn.source;
  const successor = edgeOut.target;
  if (predecessor === successor || !remainingNodeIds.has(predecessor) || !remainingNodeIds.has(successor)) return kept;
  const reconnected: FlowDesignerEdge = { ...edgeIn, target: successor };
  const route = edgeRouteKey(reconnected);
  if (kept.some((e) => edgeRouteKey(e) === route)) return kept;
  return edges.flatMap((e) => (e === edgeIn ? [reconnected] : touches(e) ? [] : [e]));
}
