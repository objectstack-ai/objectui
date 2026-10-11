#!/usr/bin/env node
/**
 * Every fenced `json` / `jsonc` NODE DOCUMENT in `content/docs` must pass the
 * STRICT AUTHORING FACE — `StrictAnyComponentSchema`, the face `objectui
 * validate` and `objectui check` judge an authored document with.
 *
 * Run:  node scripts/check-doc-json-fences.mjs          (also `pnpm check:doc-json`)
 *       node scripts/check-doc-json-fences.mjs --list   (also print every fence and
 *                                                        the bucket it fell in)
 * Exit: 0 = every judged node document is accepted or carries a declaration the
 *       face confirms, every declaration is attached and needed, and the
 *       harness proved itself on its own controls.
 *       1 = THE GATE RAN AND FOUND ERRORS. A node document is refused, or a
 *       declaration is stale, dangling or unexplained. Everything printed above
 *       the summary is a verdict about a document.
 *       2 = THE GATE COULD NOT RUN, so nothing printed above is a verdict about
 *       any document: `@object-ui/types` is not built, the JSONC reader cannot
 *       be resolved, a control failed, or the enumeration came back empty or
 *       without its anchor page. Fix the tree and re-run. Never read this as a
 *       documentation defect, and never as a pass.
 *
 * The three codes are the sibling gate's (`scripts/check-doc-snippet-types.mjs`,
 * its "Why could not run is its own exit code" section), for the same reason.
 *
 * ## Why this exists (objectui#5250)
 *
 * The ts/tsx snippet gate reads `ts` / `tsx` / `typescript` fences and nothing
 * else, so a `json` fence was checked by nothing: objectui#5229 taught
 * `"validation": { … }` on an `input` node in `content/docs/blocks/forms.mdx`
 * while every shipped tool was green. And a gate that parsed those fences
 * against the TOLERANT face would have caught nothing either, because
 * `BaseSchemaCore` is `.passthrough()`. The maintainer ruling on objectui#5250
 * (2026-09-04, decision batch #25, option 2) ordered both halves, in this order:
 * "each node schema gets a derived strict variant; `objectui validate` and the
 * doc-snippet gates run **strict**", and "a JSON-fence gate (option 1) is then
 * built **on top of** the strict face — ⛔ not before it". The strict face is
 * objectui#8345; `objectui validate` / `objectui check` moved onto it in slice A
 * (`validateAuthoredDocument`, `packages/cli/src/utils/authoring-face.ts`).
 * This gate is that ruling's JSON-fence slice.
 *
 * ## One authority: the face the CLI imports, built
 *
 * The verdict here is `StrictAnyComponentSchema.safeParse(document).success`,
 * read from `@object-ui/types`' BUILT `./zod` entry — the module
 * `@object-ui/cli` resolves at runtime for `validateAuthoredDocument`, whose
 * whole body is that same call. So a document this gate accepts is a document
 * `objectui validate` accepts, and the reverse, by construction rather than by
 * a second copy of the rule. `scripts/__tests__/check-doc-json-fences.test.ts`
 * pins the agreement by running the CLI's own door over the same corpus.
 *
 * The tolerant face (`AnyComponentSchema`) is read too, for the WORDS only: a
 * refusal it does not share is reported as "strict-only — every reason is an
 * undeclared key". It decides nothing.
 *
 * ⛔ Not from `src/`. The repository's root `tsconfig.json` maps
 * `@object-ui/types` to source, which is one inherited config away from judging
 * the docs against a face nobody installs; the RESOLUTION control below prints
 * the resolved file and refuses one outside the package's `dist/`. The
 * workflow (`doc-snippet-types.yml`) runs this gate after it has built the
 * snippet gate's `--build-filter` closure, which carries `@object-ui/types`.
 *
 * ## What a "node document" is — the population, stated
 *
 * The predicate `scripts/measure-strict-authoring-face.mjs` measured the
 * programme with (objectui#7581), with two corrections, both toward reading
 * MORE:
 *
 *   1. a fence whose language (the first token of its info string,
 *      case-insensitive) is `json` or `jsonc`;
 *   2. whose body parses — `json` with `JSON.parse`, the reader `objectui
 *      validate` uses; `jsonc` with `jsonc-parser` and the options `objectui
 *      check` reads a `.json` file with (comments, trailing commas). ⚠️
 *      Correction one: the measurement read `jsonc` with `JSON.parse` too, so
 *      every `jsonc` fence carrying a comment fell out of its population while
 *      teaching keys like any other;
 *   3. into a plain object with a string `type`;
 *   4. whose `type` names an arm of `AnyComponentSchema` (walked through its
 *      unions and lazies, by the `type` literals each object arm declares).
 *
 * ⚠️ Correction two: a fence inside a blockquote is read, its quote prefix
 * stripped the way the sibling gate strips it. The measurement's scanner did
 * not see quoted fences at all.
 *
 * Everything else is NOT JUDGED, and is counted rather than skipped in silence:
 * the summary prints each bucket (not JSON · not an object · no string `type` ·
 * a `type` no node schema declares, with the types), and `--list` prints every
 * fence with its bucket. A `type` no arm declares is refused by the tolerant
 * face as well; whether a `type` literal names a registered component is
 * `scripts/check-doc-component-types.mjs`'s question, not this gate's.
 *
 * ## The rule for fragments: a declaration the face confirms
 *
 * A node document that is deliberately not a complete, valid one — a
 * deliberately refused example that shows the error, an excerpt whose required
 * keys the page elides, an object whose `type` happens to collide with a node
 * type but is not a node — must be DECLARED by a marker line immediately above
 * its fence, at the fence's own quote depth, carrying a written reason. The two
 * spellings are quoted in `FRAGMENT_MARKER_EXAMPLES` (a block comment cannot
 * quote them). The keyword is `fragment` for every kind, as in the sibling
 * gate; the reason says which kind. ⛔ The namespace is `doc-json:`, not
 * `doc-snippet:`, on purpose: the sibling gate reports a `doc-snippet:` marker
 * that sits above anything but a ts/tsx fence as stale, so one spelling cannot
 * serve both gates without coupling them.
 *
 * A declaration is never taken on trust. It is re-judged on every run:
 *
 *   - the fence below it must be a node document the strict face REFUSES. A
 *     declaration on a fence the face accepts, or on a fence that is not a node
 *     document at all, exempts nothing and is reported as stale — so the list
 *     of declarations can only shrink, never accrete;
 *   - a marker with no fence directly below it is reported as dangling;
 *   - a reason shorter than the sibling gate's minimum is not a declaration;
 *   - a reason that claims the fence was checked is refused, by the sibling
 *     gate's own `VERIFICATION_CLAIM` (objectui#7505): a declared fence is not
 *     judged for its verdict, so a claim about it cannot be re-verified.
 *
 * ## Controls — a probe that cannot fail is not a probe
 *
 * Run on every invocation, before any verdict about a document:
 *
 *   RESOLUTION  the face module resolves inside `packages/types/dist/`, and the
 *               resolved file is printed.
 *   REFUSES     a document carrying one undeclared key MUST be refused by the
 *               strict face and accepted by the tolerant one. A face that
 *               accepts it is the passthrough face, and every green below
 *               would be the objectui#5250 green this gate exists to end.
 *   ACCEPTS     a declared-only document MUST be accepted. A harness broken the
 *               other way reds every page at once and reads as "the docs are
 *               full of defects".
 *   ANTI-IDLE   the walk must judge at least one node document, and
 *               `ANCHOR_DOCUMENT` — the page objectui#5229 was found on — must
 *               contribute one. An enumeration that collapsed (a moved root, a
 *               broken language filter, a scanner that stopped seeing fences)
 *               exits 2 instead of printing a green over nothing.
 *
 * ## What this gate does NOT answer
 *
 *   1. Whether a ts/tsx snippet compiles — `scripts/check-doc-snippet-types.mjs`.
 *   2. Whether a `type` literal names a registered component —
 *      `scripts/check-doc-component-types.mjs`.
 *   3. Whether a `${…}` sits on a key `SchemaRenderer` evaluates —
 *      `scripts/check-doc-expression-carriage.mjs` (report-only).
 *   4. ⚠️ Any page outside `content/docs`. The package READMEs, the root
 *      `README.md`, the `apps/<app>/docs` trees and the root `docs/` tree are
 *      NOT READ here, and nothing about them is claimed by a green run. That is
 *      the population objectui#5250's measurement priced; widening it is a
 *      change of this constant and of the pages it would then read.
 *   5. Whether a key the face DECLARES is read by a renderer. A declared key
 *      nothing reads passes here; that is the declaration side's question.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MIN_REASON_LENGTH,
  VERIFICATION_CLAIM,
  isBlankAtDepth,
  quoteDepthOf,
  stripQuotePrefix,
} from './check-doc-snippet-types.mjs';
import { isEntrypoint } from './invoked-as.mjs';
import { closesFence, openFence } from './markdown-fence-scan.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── Configuration ────────────────────────────────────────────────────────────

/** The scan surface. See the header's "does NOT answer" item 4. */
export const DOCS_ROOT = 'content/docs';

/** Page extensions collected under `DOCS_ROOT` — both, as the sibling gate collects. */
export const DOC_EXTENSIONS = ['.mdx', '.md'];

/** The fence languages read. Matched against the first info token, lower-cased. */
export const JSON_FENCE_LANGUAGES = new Set(['json', 'jsonc']);

/**
 * A page that must contribute at least one judged node document on every run —
 * the page objectui#5229 was found on. If it stops holding one (moved, renamed,
 * or its fences rewritten away), name another; ⛔ never delete the control.
 */
export const ANCHOR_DOCUMENT = 'content/docs/blocks/forms.mdx';

/** The package and entry the face is read from — the one `@object-ui/cli` imports. */
export const FACE_PACKAGE_DIR = 'packages/types';
export const FACE_ENTRY = './zod';

/** The package whose dependency `jsonc-parser` is — the reader `objectui check` uses. */
export const JSONC_READER_OWNER = 'packages/cli';

export const EXIT_CODES = {
  /** Every judged node document passed, every declaration held, the controls held. */
  verified: 0,
  /** The gate RAN. A document or a declaration is at fault — a verdict was read. */
  documentsFailed: 1,
  /** The gate COULD NOT RUN. Nothing it printed is a verdict about a document. */
  couldNotRun: 2,
};

/**
 * The declaration a deliberate fragment carries; see `FRAGMENT_MARKER_EXAMPLES`.
 * Matched against the line with its blockquote markers stripped.
 */
export const FRAGMENT_MARKER =
  /^[ \t]*(?:\{\/\*|<!--)[ \t]*doc-json:[ \t]*fragment[ \t]*(?:—|--|-|:)[ \t]*(.+?)[ \t]*(?:\*\/\}|-->)[ \t]*$/;

/** The marker, spelled out: the MDX expression comment, then the HTML comment. */
export const FRAGMENT_MARKER_EXAMPLES = [
  '{/* doc-json: fragment — why this fence is not a complete, valid node document */}',
  '<!-- doc-json: fragment — why this fence is not a complete, valid node document -->',
];

/** The REFUSES control: one undeclared key on a declared-only node. */
export const REFUSED_CONTROL = { type: 'button', label: 'Save', thisKeyIsDeclaredNowhere: true };
/** The ACCEPTS control: the same node, declared keys only. */
export const ACCEPTED_CONTROL = { type: 'button', label: 'Save' };

// ── Scanning ─────────────────────────────────────────────────────────────────

/** Every page in the scan set, repo-relative and POSIX-separated, in a stable order. */
export function listDocuments(root = repoRoot) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (DOC_EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(relative(root, p).split(sep).join('/'));
    }
  };
  const docsRoot = join(root, DOCS_ROOT);
  if (existsSync(docsRoot)) walk(docsRoot);
  return out;
}

/**
 * Every json/jsonc fence in one page, with the marker that declares it, and
 * every marker in the page. Fences are opened and closed by
 * `markdown-fence-scan.mjs` — the one answer to "is this a fence" — read
 * through the quote prefix of the line that opened them, so a fence inside a
 * callout is collected with its `>` stripped from every body line.
 *
 * A marker declares the fence whose opener is the nearest non-blank line below
 * it AT THE SAME QUOTE DEPTH (a bare `>` spacer counts as blank), the sibling
 * gate's attachment rule.
 */
export function scanJsonFences(source) {
  const lines = source.split('\n');
  const fences = [];
  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const markerDepth = quoteDepthOf(lines[i]);
    const marker = FRAGMENT_MARKER.exec(stripQuotePrefix(lines[i], markerDepth));
    if (marker) markers.push({ line: i + 1, depth: markerDepth, reason: marker[1].trim(), consumed: false });

    const depth = quoteDepthOf(lines[i]);
    const open = openFence(stripQuotePrefix(lines[i], depth));
    if (!open) continue;
    let close = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (closesFence(stripQuotePrefix(lines[j], depth), open)) {
        close = j;
        break;
      }
    }
    const language = open.lang.toLowerCase();
    if (JSON_FENCE_LANGUAGES.has(language)) {
      let k = i - 1;
      while (k >= 0 && isBlankAtDepth(lines[k], depth)) k--;
      const above = k >= 0 ? markers.find((m) => m.line === k + 1 && m.depth === depth) : undefined;
      if (above) above.consumed = true;
      fences.push({
        fenceLine: i + 1,
        language,
        quoteDepth: depth,
        body: lines
          .slice(i + 1, close)
          .map((line) => stripQuotePrefix(line, depth))
          .join('\n'),
        fragmentReason: above ? above.reason : null,
      });
    }
    i = close;
  }
  return { fences, markers };
}

// ── Classification ───────────────────────────────────────────────────────────

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The `type` literals one schema declares, or `null` when it declares none. */
function typeLiterals(schema) {
  const def = schema?._zod?.def;
  if (!def) return null;
  if (def.type === 'literal') return def.values.filter((v) => typeof v === 'string');
  if (def.type === 'enum') return Object.values(def.entries).filter((v) => typeof v === 'string');
  if (def.type === 'union') {
    const out = [];
    for (const option of def.options) {
      const literals = typeLiterals(option);
      if (!literals) return null;
      out.push(...literals);
    }
    return out;
  }
  return null;
}

/**
 * The node types the face declares: every `type` literal of every object arm
 * of `AnyComponentSchema`, walked through nested unions and lazies.
 */
export function nodeTypesOf(anyComponentSchema) {
  const types = new Set();
  const visit = (schema, depth) => {
    const def = schema?._zod?.def;
    if (!def || depth > 8) return;
    if (def.type === 'union') {
      for (const option of def.options) visit(option, depth + 1);
      return;
    }
    if (def.type === 'lazy') {
      let inner;
      try {
        inner = def.getter();
      } catch {
        return;
      }
      visit(inner, depth + 1);
      return;
    }
    if (def.type !== 'object') return;
    for (const t of typeLiterals(def.shape?.type) ?? []) types.add(t);
  };
  visit(anyComponentSchema, 0);
  return types;
}

/**
 * Which bucket one fence falls in. `parseJsonc` is `jsonc-parser`'s `parse`;
 * the options are the ones `objectui check` reads a `.json` file with.
 *
 * @returns {{ kind: 'notJson' | 'notAnObject' | 'noTypeKey' | 'unresolvedType' | 'document', type?: string, value?: unknown }}
 */
export function classifyFence(fence, { nodeTypes, parseJsonc }) {
  let value;
  if (fence.language === 'jsonc') {
    const errors = [];
    value = parseJsonc(fence.body, errors, { allowTrailingComma: true });
    if (errors.length > 0 || value === undefined) return { kind: 'notJson' };
  } else {
    try {
      value = JSON.parse(fence.body);
    } catch {
      return { kind: 'notJson' };
    }
  }
  if (!isPlainObject(value)) return { kind: 'notAnObject' };
  if (typeof value.type !== 'string') return { kind: 'noTypeKey' };
  if (!nodeTypes.has(value.type)) return { kind: 'unresolvedType', type: value.type };
  return { kind: 'document', type: value.type, value };
}

// ── Reading a refusal ────────────────────────────────────────────────────────

const formatPath = (path) => (path.length > 0 ? path.join(' → ') : '(root)');

/** An arm whose only complaint is the base type of the value — the primitives a slot admits. */
const isShapeMismatchOnly = (leaves) =>
  leaves.every((l) => l.code === 'invalid_type' && /received (array|object|string|number|boolean)/.test(l.message));

/**
 * The issues worth printing, flattened. A union issue (`Invalid input`) says
 * nothing on its own, so it is replaced by the issues of the arm the value
 * comes closest to fitting: arms that only refuse the value's base type are
 * set aside, and the arm with the fewest remaining issues is shown. Words
 * only — the verdict is `success`, never this list.
 */
export function readableIssues(issues, prefix = []) {
  const out = [];
  for (const issue of issues) {
    const path = [...prefix, ...(issue.path ?? [])];
    if (issue.code === 'invalid_union' && Array.isArray(issue.errors) && issue.errors.length > 0) {
      const arms = issue.errors.map((arm) => readableIssues(arm, path));
      const informative = arms.filter((leaves) => !isShapeMismatchOnly(leaves));
      const best = (informative.length > 0 ? informative : arms).sort((a, b) => a.length - b.length)[0];
      out.push(...best);
      continue;
    }
    out.push({ code: issue.code, path, message: String(issue.message ?? ''), keys: issue.keys });
  }
  return out;
}

/** One printed line per issue: an undeclared key by name, anything else by its message. */
export function describeIssue(issue) {
  if (issue.code === 'unrecognized_keys' && Array.isArray(issue.keys)) {
    const keys = issue.keys.map((k) => `"${k}"`).join(', ');
    return `at ${formatPath(issue.path)}: undeclared key${issue.keys.length === 1 ? '' : 's'} ${keys}`;
  }
  const message = issue.message.length > 220 ? `${issue.message.slice(0, 217)}...` : issue.message;
  return `at ${formatPath(issue.path)}: ${message}`;
}

// ── The analysis ─────────────────────────────────────────────────────────────

/**
 * Judge every json/jsonc fence on the scan surface.
 *
 * `judge(document)` is the strict verdict (`{ success, error? }`); `tolerant`
 * is the tolerant face's, read for words only. Both are injected so the test
 * suite can hand in the CLI's own door and the source face. `anchor: null`
 * switches the anchor control off, for a fixture tree that has no anchor page.
 *
 * @param {{
 *   root?: string,
 *   judge: (doc: unknown) => { success: boolean, error?: { issues: any[] } },
 *   tolerant?: (doc: unknown) => { success: boolean },
 *   nodeTypes: Set<string>,
 *   parseJsonc: (text: string, errors: unknown[], options: object) => unknown,
 *   anchor?: string | null,
 * }} options
 */
export function analyze({ root = repoRoot, judge, tolerant, nodeTypes, parseJsonc, anchor = ANCHOR_DOCUMENT }) {
  const findings = [];
  const preconditions = [];
  const documents = listDocuments(root);
  const buckets = { notJson: [], notAnObject: [], noTypeKey: [], unresolvedType: [] };
  const judged = [];
  const accepted = [];
  const declared = [];
  const refused = [];
  let fenceCount = 0;

  for (const doc of documents) {
    const { fences, markers } = scanJsonFences(readFileSync(join(root, doc), 'utf8'));
    fenceCount += fences.length;
    for (const marker of markers) {
      if (!marker.consumed) {
        findings.push({
          reason: 'dangling-fragment-marker',
          site: `${doc}:${marker.line}`,
          detail: 'a `doc-json: fragment` marker must sit immediately above the json/jsonc fence it declares',
        });
      }
    }
    for (const fence of fences) {
      const site = `${doc}:${fence.fenceLine}`;
      const c = classifyFence(fence, { nodeTypes, parseJsonc });
      if (fence.fragmentReason !== null) {
        if (fence.fragmentReason.length < MIN_REASON_LENGTH) {
          findings.push({ reason: 'unexplained-fragment', site, detail: 'a fragment declaration must say why the fence is not a complete, valid node document' });
        }
        const claim = VERIFICATION_CLAIM.exec(fence.fragmentReason);
        if (claim) {
          findings.push({
            reason: 'verification-claim-on-fragment',
            site,
            detail: `a declared fence is not judged for its verdict, so this gate cannot re-verify "${claim[0]}" on any later commit. Say why the fence is not a complete document without asserting it was checked.`,
          });
        }
      }
      if (c.kind !== 'document') {
        buckets[c.kind].push({ site, type: c.type });
        if (fence.fragmentReason !== null) {
          findings.push({ reason: 'stale-fragment-marker', site, detail: 'this fence is not a node document, so nothing judges it and the declaration exempts nothing — delete the marker' });
        }
        continue;
      }
      const verdict = judge(c.value);
      const entry = { site, doc, type: c.type, value: c.value };
      judged.push(entry);
      if (verdict.success) {
        if (fence.fragmentReason !== null) {
          findings.push({ reason: 'stale-fragment-marker', site, detail: `the strict face ACCEPTS this \`${c.type}\` node, so it is a complete document and the declaration exempts nothing — delete the marker` });
        } else accepted.push(entry);
        continue;
      }
      if (fence.fragmentReason !== null) {
        declared.push({ ...entry, reason: fence.fragmentReason });
        continue;
      }
      const strictOnly = tolerant ? tolerant(c.value).success === true : null;
      refused.push(entry);
      findings.push({
        reason: 'refused',
        site,
        detail:
          `the strict authoring face refuses this \`${c.type}\` node` +
          (strictOnly === true
            ? ' (the tolerant face accepts it, so every reason is a key no schema declares)'
            : strictOnly === false
              ? ' (the tolerant face refuses it too)'
              : ''),
        issues: readableIssues(verdict.error?.issues ?? []).map(describeIssue),
      });
    }
  }

  if (documents.length === 0) {
    preconditions.push({ reason: 'empty-enumeration', site: DOCS_ROOT, detail: 'no page was found on the scan surface' });
  } else if (judged.length === 0) {
    preconditions.push({ reason: 'nothing-judged', site: DOCS_ROOT, detail: 'the walk judged no node document at all — the enumeration collapsed, so a green here would be over nothing' });
  }
  if (anchor && !judged.some((j) => j.doc === anchor)) {
    preconditions.push({ reason: 'anchor-unread', site: anchor, detail: 'the anchor page contributed no judged node document — the scanner, the language filter or the page has moved; name another anchor, never delete the control' });
  }

  return { documents, fenceCount, buckets, judged, accepted, declared, refused, findings, preconditions };
}

// ── Loading the face and the reader ──────────────────────────────────────────

/** The built face's file, from the face package's own `exports` — `null` when unbuilt. */
export function resolveFaceFile(root = repoRoot) {
  const manifest = JSON.parse(readFileSync(join(root, FACE_PACKAGE_DIR, 'package.json'), 'utf8'));
  const entry = manifest.exports?.[FACE_ENTRY];
  const target = typeof entry === 'string' ? entry : entry?.import ?? entry?.default;
  if (typeof target !== 'string') return { file: null, detail: `${FACE_PACKAGE_DIR}/package.json declares no importable \`${FACE_ENTRY}\` entry` };
  const file = join(root, FACE_PACKAGE_DIR, target);
  return { file, detail: null };
}

/** The controls, against the loaded faces. Each failure is a reason the run could not be read. */
export function controlFailures({ judge, tolerant, nodeTypes }) {
  const failures = [];
  if (!nodeTypes.has(REFUSED_CONTROL.type)) failures.push(`the node-type walk does not reach \`${REFUSED_CONTROL.type}\` — it read ${nodeTypes.size} type(s)`);
  if (judge(REFUSED_CONTROL).success) failures.push('REFUSES: the strict face accepted a document carrying an undeclared key — it is the passthrough face');
  if (tolerant && !tolerant(REFUSED_CONTROL).success) failures.push('REFUSES: the tolerant face refused the control document — the control no longer isolates the undeclared key; pick another');
  if (!judge(ACCEPTED_CONTROL).success) failures.push('ACCEPTS: the strict face refused a declared-only document — the harness is broken in the other direction');
  return failures;
}

function printFindingList(items) {
  for (const f of items) {
    console.error(`  ❌  ${f.site} — ${f.detail}`);
    for (const line of f.issues ?? []) console.error(`        ${line}`);
  }
}

export async function main(argv = process.argv.slice(2), root = repoRoot) {
  const list = argv.includes('--list');

  const { file: faceFile, detail: faceDetail } = resolveFaceFile(root);
  if (!faceFile || !existsSync(faceFile)) {
    console.error(
      `⛔  check-doc-json-fences could not run: the strict authoring face is not built (${faceDetail ?? faceFile}).\n` +
        '    Build it, then re-run:  pnpm --filter @object-ui/types build\n' +
        '    Nothing above is a verdict about any document.',
    );
    return EXIT_CODES.couldNotRun;
  }
  const faceRelative = relative(root, faceFile).split(sep).join('/');
  if (!faceRelative.startsWith(`${FACE_PACKAGE_DIR}/dist/`)) {
    console.error(`⛔  RESOLUTION: the face resolved to ${faceRelative}, outside ${FACE_PACKAGE_DIR}/dist/ — refusing to judge the docs against it.`);
    return EXIT_CODES.couldNotRun;
  }

  let face;
  let parseJsonc;
  try {
    face = await import(pathToFileURL(faceFile).href);
    parseJsonc = createRequire(join(root, JSONC_READER_OWNER, 'package.json'))('jsonc-parser').parse;
  } catch (error) {
    console.error(`⛔  check-doc-json-fences could not run: ${String(error?.message ?? error).split('\n')[0]}`);
    return EXIT_CODES.couldNotRun;
  }
  if (!face.StrictAnyComponentSchema || !face.AnyComponentSchema || typeof parseJsonc !== 'function') {
    console.error('⛔  check-doc-json-fences could not run: the face module exports no StrictAnyComponentSchema / AnyComponentSchema, or jsonc-parser has no parse.');
    return EXIT_CODES.couldNotRun;
  }

  const judge = (doc) => face.StrictAnyComponentSchema.safeParse(doc);
  const tolerant = (doc) => face.AnyComponentSchema.safeParse(doc);
  const nodeTypes = nodeTypesOf(face.AnyComponentSchema);

  const failures = controlFailures({ judge, tolerant, nodeTypes });
  if (failures.length > 0) {
    console.error('⛔  check-doc-json-fences could not run — a control failed, so no verdict below would mean anything:');
    for (const f of failures) console.error(`    ${f}`);
    return EXIT_CODES.couldNotRun;
  }

  const r = analyze({ root, judge, tolerant, nodeTypes, parseJsonc });

  if (list) {
    for (const j of r.accepted) console.log(`  accepted        ${j.site}  ${j.type}`);
    for (const j of r.declared) console.log(`  declared        ${j.site}  ${j.type}  — ${j.reason}`);
    for (const j of r.refused) console.log(`  refused         ${j.site}  ${j.type}`);
    for (const [bucket, items] of Object.entries(r.buckets)) {
      for (const item of items) console.log(`  ${bucket.padEnd(15)} ${item.site}${item.type ? `  ${item.type}` : ''}`);
    }
  }

  if (r.findings.length > 0) {
    console.error(`\n❌  JSON doc fences: ${r.findings.length} finding(s) — the strict authoring face is the face \`objectui validate\` judges with.`);
    printFindingList(r.findings);
  }

  const unresolvedTypes = [...new Set(r.buckets.unresolvedType.map((b) => b.type))].sort();
  console.log(
    [
      '',
      `JSON doc fences — strict authoring face: ${faceRelative} (StrictAnyComponentSchema, the face \`objectui validate\` and \`objectui check\` judge with)`,
      `  scan surface: every ${DOC_EXTENSIONS.join(' / ')} page under ${DOCS_ROOT}/ — ${r.documents.length} page(s), ${r.fenceCount} json/jsonc fence(s)`,
      `  judged node documents: ${r.judged.length} — ${r.accepted.length} accepted, ${r.declared.length} declared fragment(s) the face refuses as declared, ${r.refused.length} refused`,
      `  not judged: ${r.buckets.notJson.length} not JSON · ${r.buckets.notAnObject.length} not an object · ${r.buckets.noTypeKey.length} without a string \`type\` · ${r.buckets.unresolvedType.length} with a \`type\` no node schema declares${unresolvedTypes.length ? ` (${unresolvedTypes.join(', ')})` : ''}`,
      `  controls: RESOLUTION, REFUSES, ACCEPTS hold over ${nodeTypes.size} node type(s); anchor ${ANCHOR_DOCUMENT} ${r.preconditions.some((p) => p.reason === 'anchor-unread') ? 'NOT read' : 'read'}`,
      `  NOT read: pages outside ${DOCS_ROOT}/ (see this script's header) — a green run claims nothing about them`,
    ].join('\n'),
  );

  if (r.preconditions.length > 0) {
    console.error('\n⛔  check-doc-json-fences could not produce a verdict — the enumeration failed its own controls:');
    printFindingList(r.preconditions);
    return EXIT_CODES.couldNotRun;
  }
  if (r.findings.length > 0) {
    console.error(
      `\n    Fix the document: remove a key no schema declares, or replace it with the declared key its renderer reads.` +
        `\n    A fence that is deliberately not a complete, valid node document is declared on the line above it:` +
        `\n      ${FRAGMENT_MARKER_EXAMPLES[0]}\n      ${FRAGMENT_MARKER_EXAMPLES[1]}`,
    );
    return EXIT_CODES.documentsFailed;
  }
  console.log('✅  Every judged JSON node document in the docs passes the strict authoring face.');
  return EXIT_CODES.verified;
}

if (isEntrypoint(import.meta.url)) {
  process.exit(await main());
}
