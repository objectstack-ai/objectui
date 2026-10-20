// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#13200 — the enumeration pin for the flow designer's node names.
 *
 * The designer names a node in words through ONE rule, `flowNodeDisplayName`,
 * and a connection through `flowEdgeDisplayName` (objectui#13143). This file
 * holds that in two halves:
 *
 * 1. `RESOLVER_SITES` — every site that formats a node or connection name for
 *    display through the rule, each asserted to still call it. A site that
 *    stops calling it goes red here.
 * 2. The id-shaped sites — the flow-designer source is scanned (comments masked
 *    by `scripts/js-comment-mask.mjs`) for the shapes that print a node by its
 *    id instead: `label || id`, `label ? label : id`, `${source} → ${target}`,
 *    a `join(' → ')` of ids, and a message parameter set to an id. Every hit
 *    must be in `ID_SITES` with the reason the id is right there (among them
 *    `own-title`, a node's own title beside its type, ruled on objectui#13200),
 *    or with `open` — a site this card's file surface did not reach, reported
 *    on objectui#13200. A new id-shaped site fails until it is converted or
 *    listed; a listed site that is gone fails until its entry is deleted, so
 *    the list only shrinks.
 *
 * The population is ENUMERATED from the directories below (AGENTS.md #9), and
 * a control proves it reaches the files this card changed.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../../../scripts/js-comment-mask.mjs';

const mask: (source: string) => string = maskComments;

const here = path.dirname(fileURLToPath(import.meta.url));
/** `packages/app-shell/src/views/metadata-admin`. */
const ADMIN = path.resolve(here, '..');
const DIRS = ['previews', 'previews/simulator', 'inspectors'];

/** The flow designer's source: `flow*` / `Flow*` files, and the Problems panel. */
function designerFiles(): string[] {
  const out: string[] = [];
  for (const dir of DIRS) {
    for (const name of readdirSync(path.join(ADMIN, dir))) {
      if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) continue;
      if (/^flow/i.test(name) || name === 'ProblemsPanel.tsx') out.push(`${dir}/${name}`);
    }
  }
  return out.sort();
}

const masked = new Map<string, string>();
function source(file: string): string {
  let s = masked.get(file);
  if (s === undefined) {
    s = mask(readFileSync(path.join(ADMIN, file), 'utf8'));
    masked.set(file, s);
  }
  return s;
}

interface ResolverSite {
  file: string;
  /** What the site shows. */
  what: string;
  /** Must match the file's masked source exactly once, the resolver call inside it. */
  pattern: RegExp;
}

const RESOLVER_SITES: ResolverSite[] = [
  {
    file: 'previews/simulator/flow-sim-validate.ts',
    what: 'the decision Problems (objectui#13143)',
    pattern: /const name = flowNodeDisplayName\(n, locale\);\s*if \(defaults\.length > 1\)/,
  },
  {
    file: 'previews/simulator/flow-sim-validate.ts',
    what: 'the unreachable-node Problem',
    pattern: /const name = flowNodeDisplayName\(n, locale\);\s*warnings\.push\(\{[^\n]*'engine\.flowValidate\.nodeUnreachable', locale, \{ name, id: n\.id \}/,
  },
  {
    file: 'previews/ProblemsPanel.tsx',
    what: 'the Problems target column, a node',
    pattern: /text: node \? flowNodeDisplayName\(node, locale\) : nodeId/,
  },
  {
    file: 'previews/ProblemsPanel.tsx',
    what: 'the Problems target column, a connection',
    pattern: /text: flowEdgeDisplayName\(p\.target, nodes, locale\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the node selection label a problem click writes',
    pattern: /onSelectionChange\?\.\(\{ kind: 'node', id: nodeId, label: node \? flowNodeDisplayName\(node, locale\) : nodeId \}\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the edge selection label a problem click writes',
    pattern: /onSelectionChange\?\.\(\{ kind: 'edge', id: p\.target\.edgeKey, label: flowEdgeDisplayName\(p\.target, nodes, locale\) \}\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the selection label of a node just added',
    pattern: /label: flowNodeDisplayName\(newNode, locale\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the selection label of a canvas node select',
    pattern: /kind: 'node', id: n\.id, label: flowNodeDisplayName\(n, locale\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the selection label of a canvas edge select',
    pattern: /kind: 'edge', id: key, label: flowEdgeDisplayName\(e, nodes, locale\)/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the selection label of a nested node select',
    pattern: /label: node \? flowNodeDisplayName\(node, locale\) : path\.nodeId/,
  },
  {
    file: 'previews/FlowPreview.tsx',
    what: 'the host header title of a connection (objectui#13143)',
    pattern: /\? flowEdgeDisplayName\(edge, Array\.isArray\(draft\.nodes\) \? draft\.nodes : \[\], locale\)/,
  },
  {
    file: 'previews/FlowRunsPanel.tsx',
    what: 'a run step’s node (objectui#13143)',
    pattern: /names\.set\(node\.id, flowNodeDisplayName\(node, locale\)\)/,
  },
  {
    file: 'inspectors/FlowEdgeInspector.tsx',
    what: 'the selection label of a reconnected edge (objectui#13143)',
    pattern: /label: flowEdgeDisplayName\(\{ source, target \}, nodes, locale\)/,
  },
  {
    file: 'inspectors/FlowEdgeInspector.tsx',
    what: 'the connection inspector’s title (objectui#13143)',
    pattern: /title=\{flowEdgeDisplayName\(edge, nodes, locale\)\}/,
  },
  {
    file: 'inspectors/FlowObjectListField.tsx',
    what: 'a branch card’s target',
    pattern: /return n \? flowNodeDisplayName\(\{ \.\.\.n, id \}, locale\) : id;/,
  },
  {
    file: 'inspectors/FlowNodeConfigField.tsx',
    what: 'the designer locale handed to a branch card’s target',
    pattern: /decisionEdgeBranches\(\s*context\.node\.id,\s*draftEdges,\s*draftNodes,\s*unpairedDecisionEdges\(context\.node\.id, value, draftEdges\),\s*locale,\s*\)/,
  },
  {
    file: 'inspectors/FlowObjectListField.tsx',
    what: 'the selection label "Edit connection" writes',
    pattern: /label: flowEdgeDisplayName\(\s*\{ source: String\(context\?\.node\?\.id \?\? ''\), target: b\.target \},/,
  },
];

/** The shapes that print a node by its id. */
const ID_SHAPES: Record<string, RegExp> = {
  'label-or-id': /\blabel\)?\s*(?:\|\||\?\?)\s*[\w.?]*?\b\w*(?:id|Id)\b/,
  'label-ternary': /\.label\s*\?\s*[\w.?]+\.label\s*:\s*\w*(?:id|Id)\b/,
  'edge-ends': /\$\{[^}]*\b(?:source|target)\}\s*→|→\s*\$\{[^}]*\b(?:source|target)\}/,
  'id-join': /\.join\(\s*['"`]\s*→\s*['"`]\s*\)/,
  'id-param': /tFormat\([^)]*\{\s*(?:id|source|target)\s*:\s*[\w.?]+\.(?:id|nodeId|source|target)\b/,
};

type Verdict =
  /** The id is kept on purpose beside or behind a name. */
  | 'id-kept'
  /** The node is missing from the flow: its id is all there is to name it by. */
  | 'missing-node'
  /** The message is about the id itself. */
  | 'id-subject'
  /** Not a node: a run id. */
  | 'not-a-node'
  /** Shows a selection's label, which the rule wrote; the id only for a selection with none. */
  | 'selection-label'
  /**
   * A node's own title, where its type is shown beside it: author label, else
   * id. The resolver would repeat the type (ruled B on objectui#13200).
   */
  | 'own-title'
  /** Names an existing node by its id, outside this card's file surface — reported on objectui#13200. */
  | 'open';

/** Keyed `file · shape · the masked line, trimmed` — content, never a line number (AGENTS.md #11). */
const ID_SITES: Record<string, Verdict> = {
  'previews/ProblemsPanel.tsx · edge-ends · title: `${p.target.source} → ${p.target.target}`,': 'id-kept',
  "previews/simulator/flow-sim-validate.ts · id-param · errors.push({ level: 'error', edge: { source: e.source, target: e.target }, message: tFormat('engine.flowValidate.edgeSourceMissing', locale, { source: e.source }) });": 'missing-node',
  "previews/simulator/flow-sim-validate.ts · id-param · errors.push({ level: 'error', edge: { source: e.source, target: e.target }, message: tFormat('engine.flowValidate.edgeTargetMissing', locale, { target: e.target }) });": 'missing-node',
  "inspectors/FlowNodeInspector.tsx · id-param · ? tFormat('engine.inspector.flowNode.idRefsUnparsed', locale, { id: node.id, refs })": 'id-subject',
  "previews/FlowRunsPanel.tsx · id-param · {tFormat('engine.flowRuns.runId', locale, { id: run.id })}": 'not-a-node',
  'previews/FlowPreview.tsx · label-or-id · : (selection.label ?? selection.id),': 'selection-label',
  'previews/FlowPreview.tsx · label-or-id · return { eyebrow: kind, title: selection.label ?? nested?.nodeId ?? selection.id };': 'selection-label',
  'inspectors/FlowEdgeInspector.tsx · label-or-id · title={selection.label ?? selection.id}': 'selection-label',
  "inspectors/FlowNodeInspector.tsx · label-or-id · <InspectorShell kindLabel={t('engine.inspector.flowNode.kind', locale)} title={selection.label ?? emptyId} onClose={onClearSelection} closeLabel={t('engine.inspector.flowNode.close', locale)}>": 'selection-label',
  // ── open: outside this card's file surface, reported on objectui#13200 ──
  "previews/FlowCanvas.tsx · id-param · ? tFormat('engine.flowCanvas.edge.undeclaredCycle', locale, { source: edge.source, target: edge.target })": 'open',
  "previews/FlowCanvas.tsx · id-param · ? tFormat('engine.flowCanvas.edge.backEdge', locale, { source: edge.source, target: edge.target })": 'open',
  'previews/FlowCanvas.tsx · edge-ends · : `${edge.source} → ${edge.target}`}': 'open',
  // ── own-title: own title beside the type eyebrow; resolver would repeat the type (ruled B on objectui#13200) ──
  'previews/FlowCanvas.tsx · label-or-id · label={node.label || node.id}': 'own-title',
  "previews/FlowPreview.tsx · label-or-id · title: (typeof node.label === 'string' && node.label) || node.id,": 'own-title',
  'previews/flow-region-view.tsx · label-or-id · <div className="truncate text-[12px] font-semibold leading-tight text-foreground" title={node.label || node.id}>': 'own-title',
  'previews/flow-region-view.tsx · label-or-id · {node.label || node.id}': 'own-title',
  'inspectors/FlowNodeInspector.tsx · label-or-id · title={node.label || node.id}': 'own-title',
  // ── open (continued) ──
  'previews/FlowSimulatorPanel.tsx · label-or-id · out.push({ id: n.id, label: n.label || n.id, type: n.type, outputs });': 'open',
  "previews/FlowSimulatorPanel.tsx · edge-ends · <span className=\"truncate\">{ed.isDefault ? 'else' : (ed.condition ?? `→ ${ed.target}`)}</span>": 'open',
  "previews/flow-node-refs.ts · edge-ends · const where = site.holder.kind === 'node' ? site.holder.id : `${site.holder.source} → ${site.holder.target}`;": 'open',
  "previews/flow-problems.ts · id-param · message: tFormat('engine.flowProblems.repeatedEdge', locale, { source: edge.source, target: edge.target }),": 'open',
  "previews/simulator/flow-sim-validate.ts · id-join · message: tFormat('engine.flowValidate.cycleDetected', locale, { cycle: cycle.join(' → ') }),": 'open',
  "previews/simulator/flow-sim-validate.ts · id-param · diag = { level: 'error', nodeId: p.nodeId, message: tFormat('engine.flowValidate.boundaryHostMissing', locale, { id: p.nodeId, host: p.id }) };": 'open',
  'previews/simulator/flow-simulator.ts · label-or-id · const step: SimStep = { seq: this.seq++, nodeId, type, label: label || nodeId, status, ...extra };': 'open',
  "inspectors/FlowNodeInspector.tsx · label-or-id · onSelectionChange?.({ kind: 'node', id: nextId, label: node.label || nextId });": 'open',
  'inspectors/FlowNodeInspector.tsx · label-or-id · <span className="max-w-[45%] truncate font-medium">{loc?.container?.label || loc?.container?.id}</span>': 'open',
  'inspectors/FlowNodeInspector.tsx · label-or-id · <span className="max-w-[45%] truncate font-medium text-foreground">{node.label || node.id}</span>': 'open',
};

function idShapedSites(): string[] {
  const hits = new Set<string>();
  for (const file of designerFiles()) {
    for (const line of source(file).split('\n')) {
      for (const [shape, re] of Object.entries(ID_SHAPES)) {
        if (re.test(line)) hits.add(`${file} · ${shape} · ${line.trim()}`);
      }
    }
  }
  return [...hits].sort();
}

describe('flow designer node names go through one rule (objectui#13200)', () => {
  it('control: the enumeration reaches every file a site lives in', () => {
    const files = designerFiles();
    for (const site of RESOLVER_SITES) expect(files).toContain(site.file);
    expect(files).toContain('previews/flow-canvas-parts.tsx');
  });

  it.each(RESOLVER_SITES.map((s) => [`${s.file} — ${s.what}`, s] as const))('%s goes through the rule', (_name, site) => {
    const matches = source(site.file).match(new RegExp(site.pattern.source, 'g')) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('every id-shaped site is listed, with the reason the id is right there or as open', () => {
    expect(idShapedSites()).toEqual(Object.keys(ID_SITES).sort());
  });

  it('control: each shape catches the spelling the converted sites used to have', () => {
    const before = [
      ['label-or-id', "onSelectionChange?.({ kind: 'node', id: nodeId, label: node?.label || nodeId });"],
      ['label-ternary', "return typeof n?.label === 'string' && n.label ? n.label : id;"],
      ['edge-ends', "onSelectionChange?.({ kind: 'edge', id: key, label: `${e.source} → ${e.target}` })"],
      ['edge-ends', "label: `${String(context?.node?.id ?? '')} → ${b.target}`"],
      ['id-param', "message: tFormat('engine.flowValidate.nodeUnreachable', locale, { id: n.id })"],
      ['id-join', "tFormat('engine.flowValidate.cycleDetected', locale, { cycle: cycle.join(' → ') })"],
    ] as const;
    for (const [shape, line] of before) expect(ID_SHAPES[shape].test(line)).toBe(true);
    // ... and passes the converted spelling.
    expect(Object.values(ID_SHAPES).some((re) => re.test("label: flowEdgeDisplayName(p.target, nodes, locale)"))).toBe(false);
    expect(
      Object.values(ID_SHAPES).some((re) =>
        re.test("tFormat('engine.flowValidate.nodeUnreachable', locale, { name, id: n.id })"),
      ),
    ).toBe(false);
  });
});
