#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * markdown-test-inputs -- which markdown documents are a TEST'S INPUT, and
 * which test reads each.
 *
 *   node scripts/markdown-test-inputs.mjs --list            the adjudicated class
 *   node scripts/markdown-test-inputs.mjs --audit           re-derive and compare
 *   node scripts/markdown-test-inputs.mjs --changed -       read paths on stdin
 *   node scripts/markdown-test-inputs.mjs --changed a.md b.md
 *
 * `--changed` prints the subset of the paths handed to it that this repository
 * has recorded as a test's input, one per line, and exits 0 whether or not the
 * subset is empty -- an EMPTY LIST IS AN ANSWER, and a non-zero exit means the
 * question could not be answered at all. That distinction is the whole contract
 * with the caller in `ci.yml`, which treats "could not answer" as RUN.
 *
 * ## The blind spot this exists to close (objectui#8861)
 *
 * The `Decide whether this change needs a full run` step in `ci.yml` diffs a
 * pull request against its merge base with every markdown path excluded, and
 * skips the expensive jobs when nothing is left. That fast path is deliberate
 * and that workflow says so in its own comment. It is sound wherever a markdown
 * change is INERT.
 *
 * It is not inert when a test READS the markdown file as data. Then a
 * markdown-only pull request mutates a test's input while skipping the test that
 * consumes it, and the pull request page goes green on a question nobody asked.
 *
 * Measured, not hypothetical: objectui#8857 changed exactly one file,
 * `packages/plugin-dashboard/README.md`. Every check on the pull request was
 * green -- `Test (shard 1/4)` reported success after ten seconds, having run
 * nothing. The merge queue, whose build short-circuits this step to "run
 * everything", then took 907 seconds on the same shard and FAILED it
 * (`SyntaxError: Unexpected token 'export'`, out of the test that reads that
 * README), and the pull request was dequeued. The queue did its job; the cost is
 * that the signal arrived after review had concluded on a green page.
 *
 * ## ⛔ Why this ships a LEDGER rather than a number
 *
 * Two probes have been run at this class and returned two different numbers --
 * 21 and 27 -- and NEITHER of them is the class. Both counted co-occurrence
 * (a test file that calls `readFileSync(` and also mentions `README.md`), and a
 * co-occurrence count is not a class predicate: a test may read something else
 * entirely and merely mention a README in its prose, several read
 * `content/docs/**` rather than a package README, and at least three read a
 * whole DIRECTORY TREE of markdown without naming a single document. Each
 * candidate has to be asked WHAT IT IS before it counts. This repository has
 * written that lesson down before (objectui#8468: one grep matched three
 * different constructs, two of them correct code).
 *
 * So the thing that ships is the derivation, in two halves that check each
 * other:
 *
 *   `ADJUDICATED`   the answer a human gave for every candidate -- what the test
 *                   reads (`reads`), and which of the scanner's guesses it does
 *                   NOT read (`notRead`), so a rejected candidate is recorded as
 *                   rejected instead of vanishing.
 *   `deriveCandidates()`  the scanner that produces the candidates from the tree
 *                   again on every run. `auditTree()` compares the two, and a
 *                   candidate nobody has adjudicated is a FINDING.
 *
 * That is what keeps the class true as documents are added: a new test that
 * reads a markdown document appears as an unadjudicated candidate and reds the
 * audit, and a new document dropped into a tree that is already declared
 * (`content/docs/**`) is covered the moment it lands.
 *
 * ## ⛔ What this does NOT answer -- read this before citing it as coverage
 *
 *   1. **Test surfaces outside `SCAN_ROOTS`.** The scan covers the product test
 *      surface. `scripts/__tests__/**` is deliberately NOT in it, on triage's
 *      instruction. ⚠️ Measured while deriving this class, that exclusion is
 *      NOT free: tests under `scripts/__tests__/**` run in the same shards, and
 *      they read a large population of repository markdown -- `AGENTS.md`,
 *      `CONTRIBUTING.md`, `QUICK_REFERENCE.md`, `docs/**`, and every package
 *      README among them. A markdown-only pull request touching one of those
 *      still walks into the blind spot this file closes for the product
 *      surface. The number matters to the decision and is recorded on the card
 *      filed for it, because widening this class to that population would make
 *      nearly every markdown document in the tree a test input, which is a
 *      different ruling from the one this file implements.
 *   2. **A read the scanner cannot see.** It resolves string literals and
 *      recognises directory walks. A test that computes a path from parts no
 *      literal carries, or reads markdown through a helper module in another
 *      file, is invisible to it -- and therefore invisible to the audit. No
 *      static scan closes that; what closes it is a reviewer adding the entry.
 *   3. **Whether the test would actually FAIL.** The question here is whether
 *      the document is an INPUT, not whether a given edit to it changes an
 *      assertion. Answering the second one requires running the test, which is
 *      exactly what the caller is deciding whether to do.
 *   4. **Non-markdown inputs.** A test reading a JSON fixture or a `.txt`
 *      corpus is the same shape of hazard, but those paths are not on the
 *      workflow's exclusion list, so they already force a full run.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntrypoint } from './invoked-as.mjs';
import { stripComments } from './js-comment-mask.mjs';

export const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/**
 * Where `deriveCandidates()` looks for tests.
 *
 * These are the roots the root Vitest config collects from, minus
 * `scripts/**` -- see limit 1 in this file's header for what that costs and why
 * it is not this file's call to change.
 */
export const SCAN_ROOTS = ['packages', 'apps', 'examples', 'eslint-rules'];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.turbo', 'coverage', 'build', '.next']);

/**
 * The adjudicated class: for every candidate the scanner produces, what a human
 * decided it is.
 *
 * `reads`   -- the markdown this test genuinely takes as input. A `…/**` entry
 *              is a directory TREE the test walks, reading every markdown
 *              document it finds; every other entry is one document.
 * `notRead` -- candidates the scanner offered for this test that it does NOT
 *              read. Recorded rather than dropped: the scanner resolves a bare
 *              `'README.md'` against the test's directory AND every ancestor of
 *              it, so a package-local read also lands on the root README. Which
 *              one is real is a question about the code, and the answer belongs
 *              where the next reader will find it.
 * `walker`  -- present when the scanner saw a directory walk in the file.
 *              `'markdown-tree'` means the walk IS the markdown read and the
 *              tree is in `reads`; `'not-markdown'` means the walk collects
 *              something else, and says what.
 */
export const ADJUDICATED = new Map([
  [
    'packages/app-shell/src/views/metadata-admin/previews/readme-flow-canvas-draft.test.ts',
    { reads: ['packages/app-shell/README.md'] },
  ],
  [
    'packages/auth/src/__tests__/reserved-auth-features.test.ts',
    {
      reads: ['packages/auth/README.md'],
      notRead: ['README.md'],
      walker: 'not-markdown: sweeps package `src` directories for `.ts` sources',
    },
  ],
  [
    'packages/components/src/__tests__/div-guidance-names-box.test.tsx',
    {
      reads: ['content/docs/components/basic/div.mdx', 'content/docs/components/basic/span.mdx'],
      walker: 'not-markdown: reads a directory of JSON schema fixtures',
    },
  ],
  [
    'packages/components/src/__tests__/guide-layout-page-buttons-7926.test.tsx',
    { reads: ['content/docs/guide/layout.md'] },
  ],
  [
    'packages/components/src/__tests__/page-body-single-node-8310.test.tsx',
    {
      reads: ['README.md'],
      notRead: ['packages/components/README.md', 'packages/components/src/__tests__/README.md'],
    },
  ],
  [
    'packages/components/src/__tests__/readme-shadcn-sync-categories.test.ts',
    { reads: ['packages/components/README_SHADCN_SYNC.md'] },
  ],
  [
    'packages/components/src/__tests__/skill-guide-data-table-binding.test.tsx',
    {
      reads: [
        'skills/objectui/guides/data-integration.md',
        'skills/objectui/guides/schema-expressions.md',
        'skills/objectui/rules/protocol.md',
      ],
      walker: 'not-markdown: concatenates plugin package `.tsx` sources',
    },
  ],
  [
    'packages/components/src/__tests__/skill-guide-provider-envelope.test.tsx',
    {
      reads: ['skills/objectui/**'],
      walker: 'markdown-tree: walks the published skill package and asserts over every `.md` in it',
    },
  ],
  [
    'packages/core/src/utils/__tests__/filter-icontains-alignment-8976.test.ts',
    { reads: ['packages/core/src/adapters/README.md'] },
  ],
  [
    'packages/create-plugin/src/__tests__/cli-cancel-and-nontty-8786.test.ts',
    {
      reads: [],
      notRead: ['README.md', 'packages/create-plugin/README.md'],
      walker: 'not-markdown: walks GENERATED output in a temp directory; its `README.md` literal names a file the generator writes, not one in this tree',
    },
  ],
  [
    'packages/create-plugin/src/__tests__/templates.test.ts',
    {
      reads: [],
      notRead: ['README.md', 'packages/create-plugin/README.md'],
      walker: 'not-markdown: reads sibling `package.json` manifests; its `README.md` literal is a generated filename',
    },
  ],
  [
    'packages/data-objectstack/src/readme-filter-operator-table.test.ts',
    { reads: ['packages/data-objectstack/README.md'] },
  ],
  [
    'packages/layout/src/__tests__/app-shell-branding-title-surfaces.test.ts',
    {
      reads: [
        'content/docs/guide/layout.md',
        'content/docs/layout/app-shell.mdx',
        'packages/layout/README.md',
      ],
      notRead: ['README.md'],
    },
  ],
  [
    'packages/layout/src/__tests__/app-shell-docs-nav-example.test.ts',
    { reads: ['content/docs/layout/app-shell.mdx'] },
  ],
  [
    'packages/layout/src/__tests__/guide-layout-app-shell-doc.test.ts',
    { reads: ['content/docs/guide/layout.md'] },
  ],
  [
    'packages/layout/src/__tests__/guide-layout-sidebar-nav-doc.test.ts',
    { reads: ['content/docs/guide/layout.md'] },
  ],
  [
    'packages/layout/src/__tests__/readme-app-shell-example.test.ts',
    { reads: ['packages/layout/README.md'], notRead: ['README.md'] },
  ],
  [
    'packages/layout/src/__tests__/readme-registration-keys.test.ts',
    { reads: ['packages/layout/README.md'], notRead: ['README.md'] },
  ],
  [
    'packages/layout/src/__tests__/readme-sidebar-nav-example.test.ts',
    { reads: ['packages/layout/README.md'], notRead: ['README.md'] },
  ],
  [
    'packages/permissions/src/__tests__/skill-guide-permission-config.test.tsx',
    { reads: ['skills/objectui/guides/auth-permissions.md'] },
  ],
  [
    'packages/plugin-calendar/src/readme-calendar-view-schema.test.ts',
    { reads: ['packages/plugin-calendar/README.md'] },
  ],
  [
    'packages/plugin-dashboard/src/__tests__/readme-dashboard-examples-spec-valid.test.ts',
    { reads: ['packages/plugin-dashboard/README.md'], notRead: ['README.md'] },
  ],
  [
    'packages/plugin-detail/src/__tests__/guideCrudAppRenders.test.tsx',
    { reads: ['content/docs/guide/building-crud-app.md'] },
  ],
  // The `reads` below is a MEASURED subset of a DERIVED population, which is
  // why it is one document rather than a tree. Two of this test's three pins
  // name `packages/plugin-detail/README.md` by constant; the third enumerates
  // `git grep -l isMultiValueField packages` and opens every hit, so any
  // markdown that starts mentioning that symbol joins the set. Measured on this
  // card: the enumeration offers 18 paths, ten of them CHANGELOGs the test
  // drops before opening anything, and exactly one markdown document survives
  // into the read set -- the same README the other two pins name. The root
  // `CHANGELOG.md` the scanner resolves is never in the population at all: the
  // pathspec is `packages`, and the bare literal comes from the drop filter.
  [
    'packages/plugin-detail/src/__tests__/relatedListParentScopeResidue-8937.test.ts',
    {
      reads: ['packages/plugin-detail/README.md'],
      notRead: ['CHANGELOG.md', 'packages/plugin-detail/CHANGELOG.md'],
    },
  ],
  [
    'packages/plugin-detail/src/renderers/__tests__/docsActivityMapTranscription-7876.test.ts',
    { reads: ['content/docs/plugins/plugin-detail.mdx'] },
  ],
  [
    'packages/plugin-form/src/__tests__/guideCrudAppRenders.test.tsx',
    { reads: ['content/docs/guide/building-crud-app.md'] },
  ],
  [
    'packages/plugin-gantt/src/readme-navigation-example.test.ts',
    { reads: ['packages/plugin-gantt/README.md'] },
  ],
  [
    'packages/plugin-grid/src/__tests__/guideCrudAppRenders.test.tsx',
    { reads: ['content/docs/guide/building-crud-app.md'] },
  ],
  [
    'packages/plugin-markdown/src/toc-anchor-parity.test.tsx',
    { reads: ['content/docs/utilities/runner.mdx'] },
  ],
  [
    'packages/types/src/__tests__/action-callback-retired-7068.test.ts',
    {
      reads: ['content/docs/**'],
      walker: 'markdown-tree: walks `content/docs` and refuses the retired callback shape in every `.md`/`.mdx` under it',
    },
  ],
  [
    'packages/types/src/__tests__/alert-dialog-read-dialect-7104.test.ts',
    { reads: ['content/docs/components/overlay/alert-dialog.mdx'] },
  ],
  [
    'packages/types/src/__tests__/button-group-doc-surface-6347.test.ts',
    { reads: ['content/docs/components/basic/button-group.mdx'] },
  ],
  [
    'packages/types/src/__tests__/calendar-doc-key-set-8830.test.ts',
    { reads: ['content/docs/plugins/plugin-calendar.mdx'] },
  ],
  [
    'packages/types/src/__tests__/calendar-flat-color-allday-8466.test.ts',
    { reads: ['packages/plugin-calendar/README.md'] },
  ],
  [
    'packages/types/src/__tests__/chat-message-avatar-keys-7295.test.ts',
    { reads: ['content/docs/plugins/plugin-chatbot.mdx'] },
  ],
  [
    'packages/types/src/__tests__/component-docs-disabled-inherited-7239.test.ts',
    {
      reads: ['content/docs/components/**'],
      walker: 'markdown-tree: walks the component doc pages and reads every `.mdx` it finds',
    },
  ],
  [
    'packages/types/src/__tests__/component-docs-retired-handler-keys-7340.test.ts',
    {
      reads: ['content/docs/**'],
      walker: 'markdown-tree: walks `content/docs` and collects handler rows from every `.md`/`.mdx` under it',
    },
  ],
  [
    'packages/types/src/__tests__/filter-builder-mirror-6939.test.ts',
    { reads: ['content/docs/components/complex/filter-builder.mdx'] },
  ],
  [
    'packages/types/src/__tests__/object-calendar-record-source-7313.test.ts',
    { reads: ['content/docs/plugins/plugin-calendar.mdx'] },
  ],
  [
    'packages/types/src/__tests__/object-kanban-group-by-limit-7322.test.ts',
    { reads: ['content/docs/plugins/plugin-kanban.mdx'] },
  ],
  [
    'packages/types/src/__tests__/object-view-unmirrored-keys-7779.test.ts',
    {
      reads: [
        'content/docs/api/schema-reference.md',
        'content/docs/plugins/plugin-view.mdx',
        'packages/plugin-view/README.md',
      ],
    },
  ],
  [
    'packages/types/src/__tests__/overlay-node-slot-doc-types-7082.test.ts',
    {
      reads: [
        'content/docs/components/feedback/empty.mdx',
        'content/docs/components/overlay/alert-dialog.mdx',
        'content/docs/components/overlay/context-menu.mdx',
        'content/docs/components/overlay/dropdown-menu.mdx',
        'content/docs/components/overlay/hover-card.mdx',
        'content/docs/components/overlay/sheet.mdx',
      ],
    },
  ],
  [
    'packages/types/src/__tests__/page-actions-refusal-7926.test.ts',
    { reads: ['content/docs/guide/layout.md'] },
  ],
  [
    'packages/types/src/__tests__/page-body-arity-8310.test.ts',
    { reads: ['README.md'], notRead: ['packages/types/README.md'] },
  ],
  [
    'packages/types/src/__tests__/page-breadcrumbs-refusal-8871.test.ts',
    { reads: ['content/docs/guide/layout.md'] },
  ],
  [
    'packages/types/src/__tests__/schema-reference-named-list-view-keys-7923.test.ts',
    { reads: ['content/docs/api/schema-reference.md'] },
  ],
  [
    'packages/vscode-extension/src/__tests__/export-to-react-compiles.test.ts',
    {
      reads: ['content/docs/utilities/vscode-extension.mdx', 'packages/vscode-extension/DESIGN.md'],
    },
  ],
]);

/** Is `rel` a markdown document at all? The only extensions this tree publishes. */
export const isMarkdown = (rel) => /\.mdx?$/.test(rel);

/**
 * Does one repo-relative path match one ledger entry?
 *
 * A `…/**` entry matches every markdown document under that directory, at any
 * depth. Anything else is one exact path -- deliberately not a glob, so a new
 * document beside a declared one does not inherit its declaration by accident.
 */
export function matchesEntry(rel, entry) {
  if (entry.endsWith('/**')) {
    const prefix = `${entry.slice(0, -3)}/`;
    return rel.startsWith(prefix) && isMarkdown(rel);
  }
  return rel === entry;
}

/** Every ledger entry, deduplicated -- the class as the workflow consults it. */
export function declaredEntries() {
  const out = new Set();
  for (const { reads } of ADJUDICATED.values()) for (const r of reads) out.add(r);
  return [...out].sort();
}

/** `document entry -> the tests that read it`, for `--list`. */
export function readersByEntry() {
  const out = new Map();
  for (const [test, { reads }] of ADJUDICATED) {
    for (const r of reads) {
      if (!out.has(r)) out.set(r, []);
      out.get(r).push(test);
    }
  }
  return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * The subset of `paths` that this repository has recorded as a test's input.
 *
 * Paths are taken as repo-relative, which is what `git diff --name-only` emits.
 */
export function markdownTestInputsAmong(paths) {
  const entries = declaredEntries();
  const out = [];
  for (const raw of paths) {
    // `git diff --name-only` wraps a path in double quotes when it holds a byte
    // it has to escape. Strip them: a quoted path that kept its quotes would
    // match no entry, and "no entry" is the answer that SKIPS.
    const unquoted = raw.trim().replace(/^"(.*)"$/, '$1');
    const rel = unquoted.replace(/^\.\//, '');
    if (!rel || !isMarkdown(rel)) continue;
    const hit = entries.find((entry) => matchesEntry(rel, entry));
    if (hit) out.push({ path: rel, entry: hit, readers: readersByEntry().get(hit) ?? [] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The scanner -- candidates, not verdicts
// ---------------------------------------------------------------------------

const TEST_FILE = /\.test\.(tsx?|jsx?)$/;
const LITERAL = /'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\\n$]*)`/g;
const WALKS = /\breaddirSync\b|\breaddir\(|\bglobSync\b/;
const SELECTS_MARKDOWN = /\.mdx\?\$|endsWith\((['"`])\.mdx?\1\)|\.mdx?['"`]/;

function collectTests(dir, out) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectTests(full, out);
    else if (TEST_FILE.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Path fragments a file could be naming: every string literal, plus every run
 * of literals separated only by commas.
 *
 * The run is what makes `join(ROOT, 'content', 'docs', 'guide', 'layout.md')`
 * legible -- one argument per segment is the spelling this tree uses most.
 */
function pathFragments(source) {
  const literals = [];
  let m;
  LITERAL.lastIndex = 0;
  while ((m = LITERAL.exec(source))) {
    literals.push({ value: m[1] ?? m[2] ?? m[3], start: m.index, end: LITERAL.lastIndex });
  }
  const out = new Set();
  for (let i = 0; i < literals.length; i += 1) {
    let joined = literals[i].value;
    out.add(joined);
    for (let j = i + 1; j < literals.length; j += 1) {
      if (!/^\s*,\s*$/.test(source.slice(literals[j - 1].end, literals[j].start))) break;
      joined = `${joined}/${literals[j].value}`;
      out.add(joined);
    }
  }
  return out;
}

/**
 * Every markdown document a test file could be naming, and whether it walks a
 * directory.
 *
 * Resolution is deliberately GENEROUS: a fragment is resolved against the test's
 * own directory and every ancestor of it up to the repository root, and every
 * resolution that exists in the tree is offered. That over-produces -- a
 * package-local `'README.md'` also lands on the root README -- and
 * over-producing is the safe direction here, because the cost of a rejected
 * candidate is one line in `ADJUDICATED` while the cost of a missed one is the
 * defect this file exists to close.
 */
export function deriveCandidates({ root = REPO_ROOT, roots = SCAN_ROOTS } = {}) {
  const files = [];
  for (const top of roots) collectTests(path.join(root, top), files);

  const out = new Map();
  for (const file of files.sort()) {
    const source = stripComments(readFileSync(file, 'utf8'));
    const bases = [];
    for (let dir = path.dirname(file); dir.startsWith(root); dir = path.dirname(dir)) bases.push(dir);

    const documents = new Set();
    for (const fragment of pathFragments(source)) {
      if (!isMarkdown(fragment)) continue;
      if (/[\s*!:?<>|]/.test(fragment)) continue; // a message or a pathspec, not a path
      if (/^\.mdx?$/.test(fragment)) continue; // the bare extension
      for (const base of bases) {
        const resolved = path.resolve(base, fragment);
        if (!resolved.startsWith(`${root}${path.sep}`)) continue;
        if (resolved.includes(`${path.sep}node_modules${path.sep}`)) continue;
        if (existsSync(resolved) && statSync(resolved).isFile()) {
          documents.add(path.relative(root, resolved));
        }
      }
    }
    const walks = WALKS.test(source) && SELECTS_MARKDOWN.test(source);
    if (documents.size || walks) {
      out.set(path.relative(root, file), { documents: [...documents].sort(), walks });
    }
  }
  return out;
}

/**
 * Compare the tree against the ledger.
 *
 * Returns one finding per disagreement. Each is a question a human has to
 * answer, never something this file guesses at.
 */
export function auditTree(candidates) {
  const findings = [];
  for (const [test, { documents, walks }] of candidates) {
    const verdict = ADJUDICATED.get(test);
    if (!verdict) {
      findings.push({
        kind: 'unadjudicated-test',
        test,
        detail:
          `reads markdown the ledger does not describe` +
          (documents.length ? ` (${documents.join(', ')})` : '') +
          (walks ? ' and walks a directory' : '') +
          `. Add it to ADJUDICATED with what it reads, or with an empty \`reads\` and why.`,
      });
      continue;
    }
    const accounted = new Set(verdict.notRead ?? []);
    for (const document of documents) {
      if (accounted.has(document)) continue;
      if ((verdict.reads ?? []).some((entry) => matchesEntry(document, entry))) continue;
      findings.push({
        kind: 'unadjudicated-document',
        test,
        detail: `resolves \`${document}\`, which is in neither \`reads\` nor \`notRead\`.`,
      });
    }
    if (walks && !verdict.walker) {
      findings.push({
        kind: 'unadjudicated-walk',
        test,
        detail: `walks a directory and selects markdown, but declares no \`walker\`.`,
      });
    }
    if (!walks && verdict.walker) {
      findings.push({
        kind: 'stale-walker',
        test,
        detail: `declares a \`walker\` the scanner no longer sees.`,
      });
    }
    for (const rejected of verdict.notRead ?? []) {
      if (!documents.includes(rejected)) {
        findings.push({
          kind: 'stale-not-read',
          test,
          detail: `rejects \`${rejected}\`, which the scanner no longer offers.`,
        });
      }
    }
  }
  for (const test of ADJUDICATED.keys()) {
    if (!candidates.has(test)) {
      findings.push({
        kind: 'stale-test',
        test,
        detail: `is in the ledger but the scanner no longer sees it reading markdown.`,
      });
    }
  }
  return findings;
}

/** Ledger entries naming one document that is not in the tree. */
export function missingDocuments({ root = REPO_ROOT } = {}) {
  return declaredEntries().filter(
    (entry) => !entry.endsWith('/**') && !existsSync(path.join(root, entry)),
  );
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function runList() {
  const readers = readersByEntry();
  for (const [entry, tests] of readers) {
    process.stdout.write(`${entry}\n`);
    for (const test of tests) process.stdout.write(`    <- ${test}\n`);
  }
  process.stdout.write(
    `\n${readers.size} declared entries, read by ${ADJUDICATED.size} adjudicated test files.\n`,
  );
  return 0;
}

function runAudit() {
  const candidates = deriveCandidates();
  const findings = auditTree(candidates);
  const missing = missingDocuments();

  for (const finding of findings) {
    process.stdout.write(`${finding.kind}: ${finding.test} ${finding.detail}\n`);
  }
  for (const entry of missing) {
    process.stdout.write(`missing-document: ${entry} is declared but is not in the tree.\n`);
  }
  if (candidates.size === 0) {
    process.stdout.write(
      'collapsed: the scanner found no markdown-reading test at all. That is not a pass — ' +
        'it means the scan roots or the scan itself stopped working.\n',
    );
    return 1;
  }
  if (findings.length === 0 && missing.length === 0) {
    process.stdout.write(
      `markdown-test-inputs: ${candidates.size} candidate test files, all adjudicated; ` +
        `${declaredEntries().length} declared entries, all present.\n`,
    );
    return 0;
  }
  process.stdout.write(
    `\n${findings.length + missing.length} finding(s). The class of markdown documents a test ` +
      `reads decides whether CI runs on a markdown-only pull request, so an unadjudicated ` +
      `candidate is a blind spot, not a formality (objectui#8861).\n`,
  );
  return 1;
}

function runChanged(args) {
  const paths = args.includes('-')
    ? [...args.filter((a) => a !== '-'), ...readStdin().split('\n')]
    : args;
  for (const hit of markdownTestInputsAmong(paths)) {
    process.stdout.write(`${hit.path}\n`);
  }
  return 0;
}

if (isEntrypoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  let code;
  if (argv[0] === '--list') code = runList();
  else if (argv[0] === '--audit') code = runAudit();
  else if (argv[0] === '--changed') code = runChanged(argv.slice(1));
  else {
    process.stderr.write(
      'usage: markdown-test-inputs.mjs (--list | --audit | --changed <path…> | --changed -)\n',
    );
    code = 2;
  }
  process.exit(code);
}
