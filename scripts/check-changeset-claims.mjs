#!/usr/bin/env node
/**
 * Reports pending changeset bodies that NAME a file this change touches, so the
 * seat doing the touching re-reads the paragraph before it publishes.
 *
 * Run:  node scripts/check-changeset-claims.mjs   (also `pnpm check:changeset-claims`)
 *       node scripts/check-changeset-claims.mjs --base <ref> --head <ref>
 *       node scripts/check-changeset-claims.mjs --audit
 * Exit: 0 = nothing to re-read, or findings (this gate is REPORT-ONLY and has
 *           no enforcing mode — see "Why it can never block" below)
 *       1 = the inputs could not be read, so this run measured nothing
 *
 * ## The defect (objectui#9003, and objectui#7721 / objectui#8617 / objectui#8759 before it)
 *
 * A `.changeset/*.md` body publishes VERBATIM into the CHANGELOG at the next
 * release. Between authoring and release it sits in the tree as ordinary prose
 * that no gate evaluates and nothing re-reads. Four gates read `.changeset/`
 * — presence, no-major, fixed, overwrite — and all four judge STRUCTURE: that a
 * declaration exists, what level it declares, how the workspace classifies it,
 * whether a change touched one it does not own. None of them reads a claim in a
 * body.
 *
 * Three instances were filed and worked one at a time before the mechanism was
 * carded. They split into two sub-shapes that end the same way:
 *
 *   BORN FALSE  - authored against the merge base while describing the head
 *                 (objectui#8759: a sentence counted two occurrences of a thing
 *                 its own diff made three).
 *   WENT FALSE  - true when written, falsified by a LATER merge
 *                 (objectui#7721, objectui#8617).
 *
 * ⛔ This gate covers WENT FALSE ONLY, and says so in its own output. It cannot
 * see a born-false claim: a changeset this change ADDS is excluded by
 * construction, and objectui#8759's defect was a cardinal in prose, which is the
 * kind of reading the next section refuses to attempt.
 *
 * ## What it judges, and the one thing it refuses to judge
 *
 * Triage fenced this card: "Do not attempt to judge prose truth automatically.
 * The four gates the card enumerates judge presence, bump level and
 * classification - mechanical properties. 'Is this sentence true?' is not one,
 * and a gate that pretends otherwise will be turned off within a month."
 *
 * So the question asked here is mechanical and has nothing to do with truth:
 *
 *   Does this changeset body NAME, in backticks, a file this change touches?
 *
 * Name resolution, not meaning. A backticked span that looks like a path is
 * resolved against the tree at the base commit, and only an UNAMBIGUOUS
 * resolution counts - exactly one tracked file. `package.json` resolves to 47
 * files in this workspace and therefore names nothing definite; a spelling like
 * `flow-node-config.spec-reconciliation.test.ts` resolves to one. That is the
 * whole filter, and it needs no hand-maintained denylist of common names.
 *
 * The output QUOTES the paragraph, never the line. From objectui#8617's landing:
 * the unit that rots is the paragraph, not the sentence - both false halves of
 * that card sat in one Migration paragraph, and correcting either alone would
 * have left the paragraph asserting the same wrong thing.
 *
 * ## Why the coordinate is a FILE NAME and not a symbol or a package
 *
 * Measured over the 25 most recent first-parent commits on `main`, against the
 * 1,384 changesets pending in the tree, counting how many pre-existing changesets
 * each commit would have been asked to re-read:
 *
 *   coordinate                                            median   mean   max
 *   symbol mentioned anywhere in the diff                    191    ---    309
 *   workspace package the diff changes a file in              25    ---    200
 *   identifier declared in exactly one file the diff edits      8   12.6    56
 *   FILE the diff edits, named unambiguously                    1    4.2    23
 *
 * Only the last one is readable. A report of 191 paragraphs is the release-time
 * wall in a different costume, and gets skimmed the same way. Symbols were
 * dropped on that number, not on taste; the runner-up (identifier declared in
 * exactly one edited file) would have caught one more of the historical
 * instances and is named in the "does not cover" list below so the trade is on
 * the record rather than lost.
 *
 * ## Why it can never block
 *
 * There is no `ENFORCE` switch and deliberately so. "A pending changeset names a
 * file you edited" is not a defect - most of the time the sentence is still
 * true. The finding is a REQUEST TO READ, addressed to the one seat that can
 * answer it without re-deriving anything: the one whose own diff is the thing
 * that might have falsified it. A gate that failed a build on this would be
 * failing it for the prose being adjacent, which is exactly the "turned off
 * within a month" shape triage named.
 *
 * An unreadable input is still exit 1, never a pass. Report-only means this gate
 * declines to fail on its FINDINGS, never that it passes without looking
 * (objectstack#4928, objectui#4690).
 *
 * ## The correction path, and the gate that reports it
 *
 * When a re-read does find a falsified claim, correcting the body is the answer,
 * and it is precedented rather than forbidden. Two commits on `main` did it: the
 * `docs(changeset)` commit that corrected two present-tense claims a later pull
 * request falsified, and the one that dropped the stale cardinal from the
 * objectui#8315 changeset. Both are prose-only, both left frontmatter untouched.
 *
 * `check-changeset-overwrite.mjs` WILL report that correction, because it reports
 * every modification of a changeset the change did not add. That report is its
 * case 2 - "You are CORRECTING a declaration on purpose ... Legitimate, and the
 * reason this gate reports instead of failing" - and that gate is report-only, so
 * the correction is not mechanically barred. ⛔ Nothing here weakens it, narrows
 * it, or carves an exemption into it: the two gates are meant to fire together on
 * a correction, one asking for the read and the other recording the write.
 *
 * ## Where it runs
 *
 * `changeset-presence.yml`, as a second job. That workflow carries NO path
 * filter, which is what this gate needs and what `changeset-guard.yml` cannot
 * give it: the change that falsifies a pending claim is an ordinary source
 * change, and nothing guarantees it touches `.changeset/**` at all. It needs no
 * install and no build - a checkout, a tree listing and one batched blob read.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntrypoint } from './invoked-as.mjs';
import { NOT_A_CHANGESET, changedFiles, describeDeclaration, resolveBaseRef } from './check-changeset-presence.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));

/** `.changeset/` with the trailing separator, so a slice needs no arithmetic. */
const CHANGESET_DIR = '.changeset/';

/**
 * Extensions a backticked span must end in to be READ as a file name.
 *
 * Deliberately generous: precision comes from unambiguous resolution against the
 * tree, not from this list. A span ending `.json` that resolves to 47 files
 * names nothing and is dropped a step later.
 */
const NAMED_FILE = /\.(?:tsx?|mts|cts|mjs|cjs|jsx?|json|ya?ml|mdx?|css|sh)$/;

/** A span that could be a repo-relative path: no spaces, no glob, no wildcards. */
const PATH_SHAPED = /^[A-Za-z0-9_.@/-]+$/;

/**
 * Every backticked span in a changeset body that is shaped like a file name.
 *
 * Backticks only. Prose names files in running text too ("the flow node
 * inspector"), but an unbackticked phrase has no boundary a parser can trust,
 * and widening to bare words is how this becomes a symbol matcher again - the
 * shape the measurement in the header rejected at 191 paragraphs per commit.
 *
 * @returns {string[]} unique spans, in first-appearance order
 */
export function namedFiles(source) {
  const seen = new Set();
  for (const match of source.matchAll(/`([^`\n]{3,200})`/g)) {
    const span = match[1].trim();
    if (NAMED_FILE.test(span) && PATH_SHAPED.test(span)) seen.add(span);
  }
  return [...seen];
}

/**
 * The paragraph of `source` that contains `span`, collapsed to single spaces.
 *
 * The paragraph is the unit deliberately (objectui#8617): a reader handed one
 * sentence corrects one sentence, and the surrounding claim keeps asserting the
 * same wrong thing. Blank-line separated, which is how a changeset body reads.
 */
export function paragraphNaming(source, span) {
  const needle = '`' + span + '`';
  for (const paragraph of source.split(/\r?\n\s*\r?\n/)) {
    if (paragraph.includes(needle)) return paragraph.replace(/\s+/g, ' ').trim();
  }
  return null;
}

// -- the tree -----------------------------------------------------------------

function git(root, args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (allowFailure) return null;
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
    throw new Error(`\`git ${args.join(' ')}\` failed${stderr ? `:\n    ${stderr}` : ''}`);
  }
}

/**
 * Every tracked path at `ref`, indexed by basename.
 *
 * `ref === null` means the working tree, so an author running this locally is
 * answered about the checkout in front of them. UNTRACKED files join the
 * listing for the same reason `check-changeset-presence` counts untracked
 * changesets: a file written a minute ago is not in the index yet, and without
 * it a body naming that file would resolve to nothing locally and to something
 * in CI — the gate disagreeing with itself depending on who ran it. Empty in
 * CI, where the checkout has no untracked files.
 *
 * @returns {{ paths: Set<string>, byBasename: Map<string, string[]> }}
 */
export function treeIndex(root, ref) {
  const listing =
    ref === null
      ? git(root, ['ls-files']) + git(root, ['ls-files', '--others', '--exclude-standard'])
      : git(root, ['ls-tree', '-r', '--name-only', '--full-tree', ref]);
  const paths = new Set();
  const byBasename = new Map();
  for (const path of listing.split('\n')) {
    if (path === '' || paths.has(path)) continue;
    paths.add(path);
    const base = path.slice(path.lastIndexOf('/') + 1);
    const bucket = byBasename.get(base);
    if (bucket) bucket.push(path);
    else byBasename.set(base, [path]);
  }
  return { paths, byBasename };
}

/**
 * The ONE tracked file a span names, or `null` when it names none or many.
 *
 * Ambiguity is not a near miss to be broken by a heuristic - a body that writes
 * `index.ts` has named no particular file, and picking one for it would invent a
 * claim the author did not make. Dropping it is the filter that makes this gate
 * readable (see the measurement in the header).
 */
export function resolveNamed(index, span) {
  if (span.includes('/')) {
    const hits = [...index.paths].filter((path) => path === span || path.endsWith('/' + span));
    return hits.length === 1 ? hits[0] : null;
  }
  const hits = index.byBasename.get(span);
  return hits && hits.length === 1 ? hits[0] : null;
}

/**
 * `paths` at `ref`, as UTF-8 strings, in ONE `git cat-file --batch` call.
 *
 * One subprocess rather than one per file, because the population is the whole
 * pending queue - 1,384 files in this tree at the time of writing, and it only
 * grows between releases. Byte lengths are honoured by slicing a Buffer: `git`
 * reports a blob's size in BYTES, and a body with a multi-byte character in it
 * would be cut in the wrong place by character arithmetic.
 *
 * @returns {Map<string, string>} present paths only; a missing one is absent
 */
export function readBlobs(root, ref, paths) {
  const out = new Map();
  if (paths.length === 0) return out;
  if (ref === null) {
    for (const path of paths) {
      try {
        out.set(path, readFileSync(join(root, path), 'utf8'));
      } catch {
        /* deleted in the working tree; absent is the answer */
      }
    }
    return out;
  }

  const batch = execFileSync('git', ['cat-file', '--batch'], {
    cwd: root,
    input: paths.map((path) => `${ref}:${path}`).join('\n') + '\n',
    maxBuffer: 512 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let cursor = 0;
  for (const path of paths) {
    const newline = batch.indexOf(10, cursor);
    if (newline === -1) break;
    const header = batch.toString('utf8', cursor, newline);
    const size = Number(header.split(' ')[2]);
    if (!Number.isFinite(size)) {
      // "<object> missing" - the path is not at this ref. Absent, not an error.
      cursor = newline + 1;
      continue;
    }
    out.set(path, batch.toString('utf8', newline + 1, newline + 1 + size));
    cursor = newline + 1 + size + 1;
  }
  return out;
}

// -- the finding --------------------------------------------------------------

/**
 * @typedef {object} Finding
 * @property {string} changeset  the pending declaration, repo-relative
 * @property {string} span       the backticked spelling in its body
 * @property {string} file       the one tracked file that spelling resolves to
 * @property {'gone' | 'edited'} severity whether the change leaves that file behind
 * @property {string | null} paragraph the paragraph naming it, whitespace collapsed
 */

/**
 * Pending changesets this change did not write, whose prose names a file it
 * touches.
 *
 * Three exclusions, each one load-bearing:
 *
 *  1. Changesets this change ADDS OR MODIFIES. A changeset naming files from its
 *     own pull request is the normal case, not a finding - it would fire on
 *     every change that carries one, which is nearly all of them here. This is
 *     also the exclusion that makes the gate blind to BORN-FALSE claims, and
 *     that limit is reported rather than papered over.
 *  2. Changesets that declare NO bump (empty frontmatter). Their body never
 *     reaches a CHANGELOG, so there is no verbatim publication to protect. 427
 *     of the 1,384 pending here are these.
 *  3. `.changeset/README.md`, which is documentation.
 *
 * Throws on any unreadable input; the CLI turns that into exit 1.
 *
 * @returns {{ findings: Finding[], pending: number, considered: number, subject: string[] }}
 */
export function claims(root, { base, head = null }) {
  const changed = changedFiles(root, { base, head });
  const ownChangesets = new Set(changed.filter((file) => file.startsWith(CHANGESET_DIR)));
  const subject = changed.filter((file) => !file.startsWith(CHANGESET_DIR));

  const baseIndex = treeIndex(root, base);
  const headIndex = treeIndex(root, head);
  const touched = new Set(subject);

  const pendingPaths = [...baseIndex.paths].filter(
    (path) =>
      path.startsWith(CHANGESET_DIR) &&
      path.endsWith('.md') &&
      !NOT_A_CHANGESET.has(path.slice(path.lastIndexOf('/') + 1)) &&
      !ownChangesets.has(path),
  );

  const findings = [];
  let considered = 0;
  if (subject.length > 0) {
    for (const [path, source] of readBlobs(root, base, pendingPaths)) {
      const declaration = describeDeclaration(source);
      if (declaration.kind !== 'frontmatter' || declaration.entries === 0) continue;
      considered += 1;
      for (const span of namedFiles(source)) {
        const file = resolveNamed(baseIndex, span);
        if (file === null || !touched.has(file)) continue;
        findings.push({
          changeset: path,
          span,
          file,
          severity: headIndex.paths.has(file) ? 'edited' : 'gone',
          paragraph: paragraphNaming(source, span),
        });
      }
    }
  }

  findings.sort((a, b) => (a.severity === b.severity ? a.changeset.localeCompare(b.changeset) : a.severity === 'gone' ? -1 : 1));
  return { findings, pending: pendingPaths.length, considered, subject };
}

/**
 * The population reading, over one tree rather than a diff.
 *
 * This is the non-vacuity control: a mechanism that reports nothing on a tree of
 * 1,384 changesets has to be able to show it would speak if it had something to
 * say. `--audit` says how many bodies name a file at all, how many of those
 * names resolve to exactly one tracked file, and how many resolve nowhere.
 *
 * ⛔ It reports; it fixes nothing and judges nothing. A name that resolves
 * nowhere is not by itself a false claim - a changeset that RETIRED a file names
 * it correctly and the file is correctly gone.
 */
export function audit(root, ref = null) {
  const index = treeIndex(root, ref);
  const pendingPaths = [...index.paths].filter(
    (path) =>
      path.startsWith(CHANGESET_DIR) &&
      path.endsWith('.md') &&
      !NOT_A_CHANGESET.has(path.slice(path.lastIndexOf('/') + 1)),
  );
  const totals = { pending: pendingPaths.length, publishing: 0, naming: 0, resolved: 0, unresolved: 0, dangling: [] };
  for (const [path, source] of readBlobs(root, ref, pendingPaths)) {
    const declaration = describeDeclaration(source);
    if (declaration.kind !== 'frontmatter' || declaration.entries === 0) continue;
    totals.publishing += 1;
    const spans = namedFiles(source);
    if (spans.length === 0) continue;
    totals.naming += 1;
    for (const span of spans) {
      if (resolveNamed(index, span) === null) {
        totals.unresolved += 1;
        totals.dangling.push(`${path}  ~  ${span}`);
      } else totals.resolved += 1;
    }
  }
  return totals;
}

// -- CLI ----------------------------------------------------------------------

if (isEntrypoint(import.meta.url)) {
  const argOf = (name) => {
    const index = process.argv.indexOf(name);
    return index > -1 ? process.argv[index + 1] : null;
  };

  const root = resolve(argOf('--root') ?? resolve(scriptDir, '..'));

  if (process.argv.includes('--audit')) {
    let totals;
    try {
      totals = audit(root, argOf('--ref'));
    } catch (error) {
      console.error(`❌  ${error.message}`);
      process.exit(1);
    }
    console.log(
      `Pending declarations: ${totals.pending}. Publishing a body verbatim at the next release: ` +
        `${totals.publishing}. Naming at least one file in backticks: ${totals.naming}.`,
    );
    console.log(
      `File names in those bodies: ${totals.resolved} resolve to exactly one tracked file, ` +
        `${totals.unresolved} resolve to none or to many.`,
    );
    console.log(
      '\n    A name that resolves to nothing is ⛔ NOT a false claim on its own — a changeset that\n' +
        '    retired a file names it correctly and the file is correctly gone. This count is the\n' +
        "    reach of the diff-mode check, not a verdict on anybody's prose.",
    );
    process.exit(0);
  }

  const head = argOf('--head');
  const base = resolveBaseRef(root, { explicit: argOf('--base') });
  if (!base.ok) {
    console.error(
      '❌  Cannot resolve the commit to compare against, so there is nothing to diff.\n' +
        `    tried: ${base.tried.join(', ')}\n` +
        (base.named
          ? '    That base was named EXPLICITLY, so it is not guessed around. Name a commit that\n' +
            '    exists in this clone, or pass none.\n'
          : base.shallow
            ? '    This clone is SHALLOW. In CI, give the checkout `fetch-depth: 0`; locally, run\n' +
              '    `git fetch --no-tags origin main` (or `git fetch --unshallow`).\n'
            : '    Fetch the base branch (`git fetch --no-tags origin main`) and re-run.\n') +
        '    A failure, not a skip: report-only means this gate declines to fail on its FINDINGS,\n' +
        '    never that it passes without looking (objectstack#4928, objectui#4690).',
    );
    process.exit(1);
  }

  let result;
  try {
    result = claims(root, { base: base.ref, head });
  } catch (error) {
    console.error(
      `❌  ${error.message}\n\n` +
        '    Reported as a failure rather than a pass: losing an input means this gate cannot tell\n' +
        '    whether anything needs re-reading (objectui#4690).',
    );
    process.exit(1);
  }

  console.log(
    `Compared ${head ?? 'the working tree'} with ${base.ref.slice(0, 9)} (${base.how}): ` +
      `${result.subject.length} file(s) changed outside .changeset/, read against ${result.considered} ` +
      `pending declaration(s) that publish a body (${result.pending} pending in total).`,
  );

  if (result.findings.length === 0) {
    console.log('✅  No pending changeset names a file this change touches.');
    process.exit(0);
  }

  const byChangeset = new Map();
  for (const finding of result.findings) {
    const bucket = byChangeset.get(finding.changeset);
    if (bucket) bucket.push(finding);
    else byChangeset.set(finding.changeset, [finding]);
  }

  console.log(
    `\n⚠️  ${byChangeset.size} pending changeset(s) describe a file this change touches. ` +
      'Their bodies publish VERBATIM into the CHANGELOG at the next release:\n',
  );
  for (const [changeset, hits] of byChangeset) {
    console.log(`      ${changeset}`);
    for (const hit of hits) {
      console.log(
        `             names \`${hit.span}\`  ->  ${hit.file}  ` +
          `(${hit.severity === 'gone' ? '⚠️  THIS CHANGE LEAVES NO SUCH FILE' : 'edited by this change'})`,
      );
      if (hit.paragraph) console.log(`             paragraph: ${hit.paragraph}`);
    }
  }

  console.log(`
    ⛔ This is NOT a claim that any of those paragraphs is false. This gate judges name
    resolution, never meaning: it asked whether a body NAMES a file you touched, which is
    as mechanical as asking whether a changeset exists. "Is this sentence still true?" is
    the one question it will not answer, and the one you are being asked to answer.

    Read the PARAGRAPH, not the line. Both false halves of the objectui#8617 claim sat in
    one paragraph, and correcting either alone would have left it asserting the same wrong
    thing.

    If a claim did go false, CORRECT THE BODY. That is precedented on this branch's history
    — the docs(changeset) commit that corrected two present-tense claims a later pull
    request falsified, and the one that dropped the stale cardinal from the objectui#8315
    changeset — and both were prose-only, with frontmatter untouched.
    \`check-changeset-overwrite.mjs\` will REPORT that correction, because it reports every
    modification of a changeset the change did not add. That report is its own case 2,
    "correcting a declaration on purpose ... legitimate", it is report-only, and it is the
    intended shape here: one gate asks for the read, the other records the write.

    ⛔ What this gate does NOT cover, stated so nobody reads it as more:
      - A claim that was BORN false — written against the merge base while describing the
        head (objectui#8759). A changeset this change adds is excluded by construction.
      - A claim about anything it does not spell as a file name in backticks: a symbol, a
        package, an installed dependency's version, a count. Symbol matching was measured
        and dropped — it asked for 191 paragraphs per commit, which is the release-time
        wall in a different costume.
      - A file named ambiguously (\`index.ts\`, \`package.json\`). A span that resolves to many
        tracked files names none of them, and this gate does not guess.

    Report-only, with no enforcing switch: a pending changeset naming a file you edited is
    usually still true. The finding is a request to read, addressed to the one seat that can
    answer it cheaply — the one whose diff might have falsified it.`);

  process.exit(0);
}
