// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * FlowPreview — read-only summary of a Flow metadata draft.
 *
 * A full DAG canvas lives in `@object-ui/plugin-designer` and would
 * pull in ReactFlow + its deps every time the metadata-admin loads,
 * which is too heavy for a glance-preview. Instead we render:
 *
 *   1. A header strip with trigger / status / runAs / version — the trigger
 *      the Start node declares, and the status the deployment reports
 *      (objectui#11779).
 *   2. A topologically ordered step list inferred from `nodes` +
 *      `edges`. Each step shows label, action type, branch markers,
 *      and outgoing edge conditions so authors can sanity-check the
 *      logic without launching the designer.
 *   3. A variables side panel listing declared flow variables.
 *
 * The renderer is defensive — drafts may be mid-edit with dangling
 * edges or duplicate node ids; we never throw, we just degrade.
 */

import * as React from 'react';
import { resolveFlowTriggerKind } from '@objectstack/spec/automation';
import {
  AlertCircle,
  Bug,
  CircleDot,
  GitBranch,
  History,
  PanelRight,
  Plus,
  Settings2,
  Variable,
  Zap,
} from 'lucide-react';
import { EmptyDescription } from '@object-ui/components';
import type { MetadataPreviewProps } from '../preview-registry.js';
import { PreviewShell, PreviewMessage, PreviewErrorBoundary } from './PreviewShell.js';
import { appendArray } from '../inspectors/_shared.js';
import { t as tr, translateFlowMeta } from '../i18n.js';
import { FlowCanvas } from './FlowCanvas.js';
import { defaultNodeLabel } from './flow-canvas-parts.js';
import { type FlowDesignerEdge, type FlowDesignerNode } from './flow-canvas-layout.js';
import { NESTED_NODE_KIND, parseNestedNodeId, encodeNestedNodeId } from '../inspectors/flow-nested-selection.js';
import { FlowSimulatorPanel } from './FlowSimulatorPanel.js';
import { FlowRunsPanel } from './FlowRunsPanel.js';
import { ProblemsPanel } from './ProblemsPanel.js';
import {
  FlowRuntimeContext,
  buildFlowProblems,
  deriveFlowRunStatus,
  deriveInvalidElements,
  describeFlowRunStatus,
  freshNodeId,
  type FlowProblem,
  type FlowRunStatusView,
} from './flow-problems.js';
import { useConnectorRegistry } from '../inspectors/connector-input-fields.js';
import { hasCommittedConnectorAction } from '../inspectors/flow-scope.js';
import { fieldsForNodeType, localizeFlowFields } from '../inspectors/flow-node-config.js';

/**
 * This preview reads the draft's nodes and edges and hands them straight to
 * {@link FlowCanvas}, so it reads them as the canvas's own types rather than
 * restating the shapes. It used to restate both — the edge including a
 * `condition` typed `string | { source?: string }`, an envelope the spec's
 * `FlowEdgeSchema` rejects for want of `dialect`; the node including a
 * `ui?: { x?: number; y?: number }` geometry key the spec's `.strict()`
 * `FlowNodeSchema` rejects outright (objectui#3172). Two copies of one shape is
 * how the wrong one survives being fixed (objectui#3202).
 */
type FlowNode = FlowDesignerNode;
type FlowEdge = FlowDesignerEdge;

/**
 * The header's Trigger pill (objectui#11779): the trigger the engine arms this
 * flow on, read from its Start node by the spec's own resolver
 * (`resolveFlowTriggerKind`, the authoring-time mirror of the engine's binding
 * resolution, in the engine's precedence). The flow-level `type` used to be
 * shown instead, so a record-triggered flow read "autolaunched".
 *
 *   - a record trigger reads as its event (the Start node's `triggerType`, e.g.
 *     "Record updated"), with the object it watches;
 *   - a time-relative sweep reads as one, with the object it sweeps;
 *   - a schedule (a `schedule` cadence on the Start node, or `type: 'schedule'`)
 *     and an inbound API hook each read as that kind;
 *   - a flow the resolver finds no trigger on — a manual / autolaunched Start,
 *     a screen flow — falls back to the flow's `type`, as before.
 *
 * The words are the Start node inspector's own option labels for the same
 * tokens (`flow-node-config`), localized the way the inspector localizes them,
 * so the header and the inspector name one trigger one way.
 */
function flowTriggerLabel(d: Record<string, unknown>, nodes: FlowNode[], locale?: string): string {
  const kind = resolveFlowTriggerKind(d);
  if (!kind) return translateFlowMeta('type', String(d.type ?? 'autolaunched'), locale);
  const config = nodes.find((n) => n?.type === 'start')?.config ?? {};
  // A record kind means the Start node's `triggerType` IS a `record-*` token —
  // the resolver read it to answer.
  const token = kind === 'record_change' ? String(config.triggerType) : kind;
  const options = localizeFlowFields('start', fieldsForNodeType('start'), locale).find((f) => f.id === 'triggerType')?.options;
  const label = options?.find((o) => o.value === token)?.label ?? token;
  const sweep = config.timeRelative as { object?: unknown } | undefined;
  const object =
    kind === 'record_change'
      ? config.objectName
      : kind === 'time_relative'
        ? (typeof sweep?.object === 'string' ? sweep.object : config.objectName)
        : undefined;
  return typeof object === 'string' && object ? `${label} · ${object}` : label;
}

interface FlowVariable {
  name: string;
  type?: string;
  defaultValue?: unknown;
  description?: string;
  isInput?: boolean;
  isOutput?: boolean;
}

export function FlowPreview({ draft, editing, selection, onSelectionChange, onPatch, locale, diagnostics }: MetadataPreviewProps) {
  const d = draft as Record<string, unknown>;
  // Memoized so hook deps (validation memo, handleAddNode) get a stable array
  // reference across renders instead of a fresh `[]`/cast each time.
  const nodes = React.useMemo<FlowNode[]>(() => (Array.isArray(d.nodes) ? (d.nodes as FlowNode[]) : []), [d.nodes]);
  const edges = React.useMemo<FlowEdge[]>(() => (Array.isArray(d.edges) ? (d.edges as FlowEdge[]) : []), [d.edges]);
  const variables: FlowVariable[] = Array.isArray(d.variables) ? (d.variables as FlowVariable[]) : [];

  // objectui#11779 — the host's runtime row for this flow (see
  // `FlowRuntimeContext`): the ONE run status the header's Status pill and the
  // Problems panel show, derived as the host's rail derives it. Read before the
  // empty-flow return below, so the hook order never depends on the draft.
  const runtime = React.useContext(FlowRuntimeContext);
  const runStatus = deriveFlowRunStatus(runtime, d.status);
  const runView = describeFlowRunStatus(runStatus, locale);

  const designMode = !!(editing && onSelectionChange);
  const canEdit = designMode && !!onPatch;
  const selectedId = selection && selection.kind === 'node' ? selection.id : null;
  const selectedEdgeId = selection && selection.kind === 'edge' ? selection.id : null;
  // #2670 Phase 3: a nested-node selection carries an encoded container path in
  // the flat selection id. Decode it HERE — FlowPreview is the only place that
  // speaks the codec; the canvas only ever handles the structured path.
  const selectedNestedPath = React.useMemo(
    () => (selection && selection.kind === NESTED_NODE_KIND ? parseNestedNodeId(selection.id) : null),
    [selection],
  );

  const [showDebug, setShowDebug] = React.useState(false);
  // Variables panel is opt-in: opening a flow should show the full-width canvas,
  // not a mostly-empty side panel (most flows declare no variables).
  const [showVars, setShowVars] = React.useState(false);
  const [showRuns, setShowRuns] = React.useState(false);
  const [showProblems, setShowProblems] = React.useState(false);
  const [runHL, setRunHL] = React.useState<{
    activeNodeId: string | null;
    visitedNodeIds: string[];
    traversedEdgeIds: string[];
  } | null>(null);

  // Unified problem list (structural + server `_diagnostics`) is the SINGLE
  // source for every validation surface — the clickable inline banner, the
  // per-element badges, the red error ring/stroke, and the Problems panel.
  // Recomputed from the live draft so they all clear as the author fixes each issue.
  // The runtime connector registry is read the way the inspectors read it —
  // only when the draft holds a committed `connector_action` — so the
  // expression scan judges that action's declared output keys in scope
  // downstream, as the inspectors do (objectui#11085).
  const connectors = useConnectorRegistry(hasCommittedConnectorAction(d));
  const problems = React.useMemo<FlowProblem[]>(
    () => buildFlowProblems({ nodes, edges, serverDiagnostics: diagnostics, variables, locale, connectors }),
    [nodes, edges, diagnostics, d.variables, locale, connectors],
  );
  const errorCount = problems.filter((p) => p.level === 'error').length;
  // Red error ring/stroke derived from the same list (errors only; a cycle
  // paints its whole loop) — no second validateFlowDraft pass.
  const { invalidNodeIds, invalidEdges } = React.useMemo(
    () => deriveInvalidElements(problems),
    [problems],
  );

  // "Reveal" handshake with the canvas: a changing nonce pans to the element.
  const [reveal, setReveal] = React.useState<{ target: FlowProblem['target']; nonce: number } | null>(null);
  const selectedKey = selectedId ? `node:${selectedId}` : (selectedEdgeId ?? null);
  const handleSelectProblem = React.useCallback(
    (p: FlowProblem) => {
      if (p.target.kind === 'node') {
        // Destructure before the .find() closure — TS drops the union narrowing
        // of `p.target` inside a nested callback, so capture nodeId as a string.
        const { nodeId } = p.target;
        const node = nodes.find((n) => n.id === nodeId);
        onSelectionChange?.({ kind: 'node', id: nodeId, label: node?.label || nodeId });
      } else if (p.target.kind === 'edge') {
        onSelectionChange?.({ kind: 'edge', id: p.target.edgeKey, label: `${p.target.source} → ${p.target.target}` });
      }
      setReveal((r) => ({ target: p.target, nonce: (r?.nonce ?? 0) + 1 }));
    },
    [nodes, onSelectionChange],
  );

  // objectui#11772 — this editing session's memory of node ids: every id it
  // has seen on a node or at either end of an edge. A node removed earlier in
  // the session — its edges gone with it, so the draft no longer names it
  // anywhere — is still never minted again: a fresh node never takes over an
  // identity the author has already seen on another node. The session is this
  // preview's mount (Studio remounts it when another flow is opened). The
  // ledger is written after each render commits and read only when a node is
  // added, by `mintNodeId`, which also takes the current draft's ids directly
  // (`freshNodeId`), so a render whose effect has not run yet loses nothing.
  // Keyed on the draft's own arrays, never on the memoised `nodes` / `edges`
  // (AGENTS.md #10); recording is idempotent, so an extra run changes nothing.
  const seenNodeIds = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    const seen = seenNodeIds.current;
    // Read as defensively as the rest of this preview: a mid-edit draft may
    // hold a hole or a half-written edge, and nothing here may throw on it.
    for (const n of Array.isArray(d.nodes) ? (d.nodes as Array<{ id?: unknown } | null>) : []) {
      if (typeof n?.id === 'string') seen.add(n.id);
    }
    for (const e of Array.isArray(d.edges) ? (d.edges as Array<{ source?: unknown; target?: unknown } | null>) : []) {
      if (typeof e?.source === 'string') seen.add(e.source);
      if (typeof e?.target === 'string') seen.add(e.target);
    }
  }, [d.nodes, d.edges]);
  const mintNodeId = React.useCallback(() => freshNodeId(nodes, edges, seenNodeIds.current), [nodes, edges]);

  const handleAddNode = React.useCallback(() => {
    if (!canEdit) return;
    // A flow's first node is its trigger — seed a `start` node (not a generic
    // `task`) so the canvas opens on the canonical entry point and the author
    // adds subsequent steps from there.
    const newNode: FlowNode = { id: mintNodeId(), type: 'start', label: defaultNodeLabel('start', locale) };
    const next = appendArray(nodes, newNode);
    onPatch!({ nodes: next });
    onSelectionChange?.({ kind: 'node', id: newNode.id, label: newNode.label || newNode.id });
  }, [canEdit, nodes, onPatch, onSelectionChange, locale, mintNodeId]);

  // Run history needs the published flow name (the engine keys runs by it).
  const flowName = typeof d.name === 'string' && d.name ? d.name : '';
  const runAs = String(d.runAs ?? 'user');
  const version = d.version != null ? String(d.version) : undefined;
  const errorStrategy = (d.errorHandling as any)?.strategy as string | undefined;

  if (nodes.length === 0) {
    return (
      <PreviewShell hint={`flow${designMode ? ' · design' : ''}`}>
        {canEdit ? (
          <div className="p-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              onClick={handleAddNode}
            >
              <Plus className="h-3 w-3" />
              {tr('engine.inspector.add.node', locale)}
            </button>
          </div>
        ) : (
          <PreviewMessage>{tr('engine.flowPreview.emptyHint', locale)}</PreviewMessage>
        )}
      </PreviewShell>
    );
  }

  return (
    <PreviewShell hint={`flow · ${nodes.length} node${nodes.length === 1 ? '' : 's'}`}>
      <PreviewErrorBoundary fallbackHint={tr('engine.flowPreview.malformed', locale)}>
        <div className={
          'grid gap-0 h-full min-h-[440px] ' +
          (showDebug || showVars || showRuns || showProblems ? 'lg:grid-cols-[1fr_240px]' : 'grid-cols-1')
        }>
          {/* Visual canvas */}
          <div className="flex flex-col min-w-0 min-h-0">
            <div className="rounded-none border-b bg-muted/30 px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
              <Pill icon={Zap} label={tr('engine.flowPreview.pill.trigger', locale)} value={flowTriggerLabel(d, nodes, locale)} />
              <Pill
                icon={CircleDot}
                label={tr('engine.flowPreview.pill.status', locale)}
                value={runView.label}
                tone={runView.tone}
                title={runView.title}
              />
              <Pill icon={Settings2} label={tr('engine.flowPreview.pill.runAs', locale)} value={translateFlowMeta('runAs', runAs, locale)} />
              {version && <Pill label="v" value={version} />}
              {errorStrategy && <Pill icon={GitBranch} label={tr('engine.flowPreview.pill.onError', locale)} value={translateFlowMeta('onError', errorStrategy, locale)} />}
              <div className="ml-auto flex items-center gap-1.5">
                {!showDebug && !showRuns && !showProblems && (
                  <button
                    type="button"
                    onClick={() => setShowVars((v) => !v)}
                    className={
                      'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ' +
                      (showVars
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground')
                    }
                    title={tr(showVars ? 'engine.flowPreview.hideVars' : 'engine.flowPreview.showVars', locale)}
                  >
                    <PanelRight className="h-3 w-3" /> {tr('engine.flowPreview.variables', locale)}
                  </button>
                )}
                {flowName && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRuns((v) => !v);
                      setShowDebug(false);
                      setShowProblems(false);
                    }}
                    className={
                      'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ' +
                      (showRuns
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground')
                    }
                    title={tr('engine.flowPreview.runsTitle', locale)}
                  >
                    <History className="h-3 w-3" /> {tr('engine.flowPreview.runs', locale)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowProblems((v) => !v);
                    setShowDebug(false);
                    setShowRuns(false);
                  }}
                  className={
                    'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ' +
                    (showProblems
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground')
                  }
                  title={tr('engine.flowPreview.problemsTitle', locale)}
                >
                  <AlertCircle className="h-3 w-3" /> {tr('engine.flowPreview.problems', locale)}
                  {problems.length > 0 && (
                    <span
                      className={
                        'ml-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ' +
                        (errorCount > 0 ? 'bg-destructive/15 text-destructive' : 'bg-amber-500/15 text-amber-600')
                      }
                    >
                      {problems.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDebug((v) => !v);
                    setShowRuns(false);
                    setShowProblems(false);
                  }}
                  className={
                    'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ' +
                    (showDebug
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground')
                  }
                >
                  <Bug className="h-3 w-3" /> {tr('engine.flowPreview.debug', locale)}
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <FlowCanvas
                nodes={nodes}
                edges={edges}
                editable={canEdit}
                designMode={designMode}
                selectedId={selectedId}
                selectedEdgeId={selectedEdgeId}
                locale={locale}
                activeNodeId={runHL?.activeNodeId ?? null}
                visitedNodeIds={runHL?.visitedNodeIds}
                traversedEdgeIds={runHL?.traversedEdgeIds}
                invalidNodeIds={invalidNodeIds}
                invalidEdges={invalidEdges}
                onRevealProblem={handleSelectProblem}
                problems={problems}
                revealSignal={reveal}
                onSelect={(n) =>
                  n
                    ? onSelectionChange?.({ kind: 'node', id: n.id, label: n.label || n.id })
                    : onSelectionChange?.(null)
                }
                onSelectEdge={(e, key) =>
                  e
                    ? onSelectionChange?.({ kind: 'edge', id: key, label: `${e.source} → ${e.target}` })
                    : onSelectionChange?.(null)
                }
                selectedNestedPath={selectedNestedPath}
                onSelectNested={(path, node) =>
                  path
                    ? onSelectionChange?.({
                        kind: NESTED_NODE_KIND,
                        id: encodeNestedNodeId(path),
                        label: node?.label || path.nodeId,
                      })
                    : onSelectionChange?.(null)
                }
                onPatch={onPatch}
                mintNodeId={mintNodeId}
              />
            </div>
          </div>

          {/* Right side panel: Variables (default), the debug simulator, or
              the engine run history. Collapsible so the canvas can use the
              full width. */}
          {showProblems ? (
            <div className="border-l bg-muted/20">
              <ProblemsPanel
                problems={problems}
                selectedKey={selectedKey}
                onSelectProblem={handleSelectProblem}
                locale={locale}
                runStatus={runStatus}
              />
            </div>
          ) : showDebug ? (
            <div className="border-l bg-muted/20">
              <FlowSimulatorPanel
                nodes={nodes}
                edges={edges}
                variables={variables}
                locale={locale}
                onRunStateChange={setRunHL}
              />
            </div>
          ) : showRuns && flowName ? (
            <div className="border-l bg-muted/20">
              <FlowRunsPanel flowName={flowName} locale={locale} />
            </div>
          ) : showVars ? (
            <div className="border-l bg-muted/20 p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Variable className="h-3 w-3" /> {tr('engine.flowPreview.variables', locale)}
            </div>
            {variables.length === 0 ? (
              <EmptyDescription className="text-xs italic">{tr('engine.flowPreview.noVars', locale)}</EmptyDescription>
            ) : (
              <ul className="space-y-1.5">
                {variables.map((v, i) => (
                  <li key={v.name || i} className="rounded border bg-background p-1.5">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="font-mono">{v.name}</span>
                      {v.type && (
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {v.type}
                        </span>
                      )}
                      {v.isInput && (
                        <span className="text-[9px] font-semibold uppercase px-1 rounded bg-sky-100 text-sky-700">
                          {tr('engine.flowPreview.varIn', locale)}
                        </span>
                      )}
                      {v.isOutput && (
                        <span className="text-[9px] font-semibold uppercase px-1 rounded bg-emerald-100 text-emerald-700">
                          {tr('engine.flowPreview.varOut', locale)}
                        </span>
                      )}
                    </div>
                    {v.defaultValue !== undefined && (
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        = {String(v.defaultValue)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          ) : null}
        </div>
      </PreviewErrorBoundary>
    </PreviewShell>
  );
}

function Pill({
  icon: Icon,
  label,
  value,
  tone = 'plain',
  title,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: FlowRunStatusView['tone'];
  /** Hover text — the run status's reason, for the Status pill. */
  title?: string;
}) {
  const cls =
    tone === 'green'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-700 dark:text-amber-300'
        : tone === 'muted'
          ? 'text-muted-foreground'
          : 'text-foreground';
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${cls}`}>{value}</span>
    </span>
  );
}
