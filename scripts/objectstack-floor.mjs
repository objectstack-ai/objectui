#!/usr/bin/env node
/**
 * objectstack-floor -- at publish, the floor of every `@objectstack/*` range a
 * published manifest declares is computed from `.objectstack-sha` (ruling B on
 * objectui#12955, executed by objectui#12958).
 *
 *   node scripts/objectstack-floor.mjs            # first step of `pnpm changeset:publish`
 *   node scripts/objectstack-floor.mjs --dry-run  # compute and report, write nothing
 *
 * ## The floor
 *
 * The EARLIEST `@objectstack/spec` version that npm carries (`npm view … versions`)
 * AND whose objectstack release tag `@objectstack/spec@<version>` contains the pin
 * (`git merge-base --is-ancestor <pin> <tag>`). A tag npm does not carry is not a
 * release. Prereleases count -- a major that has not shipped exists on npm only as
 * `X.0.0-next.N` -- and versions are ordered by semver precedence, so a pin inside
 * `18.0.0-next.3` floors at `next.3` even after `18.0.0` ships. objectstack versions
 * its packages as one fixed group, so the spec's version is the floor of every
 * `@objectstack/*` range; each name a range moves to is read on npm at that version
 * before anything is written.
 *
 * Tags and history come from a treeless fetch (`--filter=tree:0`: commits only, no
 * depth limit, so a non-ancestor answer is real) of objectstack's public repository
 * into a temporary directory -- no secret and no objectstack checkout, the same
 * anonymous access `scripts/objectstack-pin.mjs` uses (`OBJECTSTACK_REPO_URL`
 * overrides both). A pin missing from that fetch is reachable from no release tag.
 *
 * ## The ranges -- every dependency field of every published manifest
 *
 * A range below the floor becomes `^<floor>`, and a `### Dependency floors` entry
 * goes under the package's `## <version>` section of CHANGELOG.md, so the move
 * reaches the released CHANGELOG: the tarball's copy, and the GitHub Release body
 * `scripts/release-github-releases.mjs` cuts from it. A range at or above the floor
 * is left as written -- it already admits no release older than the pin. Every
 * range is reported. The writes are the runner's, read by `changeset publish`; the
 * tagged commit keeps the ranges `main` declares.
 *
 * `scripts/check-spec-range-floors.mjs` runs after this step: a release that
 * contains the pin can still have removed a symbol the artifact uses, and only that
 * gate reads the floor release's exports.
 *
 * ## Exit codes -- nothing is written unless the answer is 0
 *
 *   0  floors computed (and written, without --dry-run)
 *   1  refused: a range whose minimum this step cannot read, a fetch or npm failure,
 *      or a moved name npm does not carry at the floor
 *   2  no published release contains the pin: publishing waits for objectstack's
 *      next release, and `spec-range-floors.yml` reads it as nothing to judge yet
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ALL_FIELDS } from './check-phantom-dependencies.mjs';
import { discoverPublishedPackages } from './check-published-dist-tooling.mjs';
import { isEntrypoint } from './invoked-as.mjs';
import { DEFAULT_REPO_URL, REPO_ROOT, readPin } from './objectstack-pin.mjs';

export const SPEC = '@objectstack/spec';
export const TAG_PREFIX = `${SPEC}@`;
const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const RANGE = /^(?:\^|~|>=|=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/** Semver precedence of two `X.Y.Z[-prerelease]` versions: negative, 0 or positive. */
export function compareVersions(a, b) {
  const [x, y] = [a, b].map((v) => {
    const m = VERSION.exec(v);
    if (!m) throw new Error(`"${v}" is not an X.Y.Z[-prerelease] version`);
    return { core: m.slice(1, 4).map(Number), pre: m[4] ? m[4].split('.') : [] };
  });
  for (let i = 0; i < 3; i += 1) if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length; // a release outranks its prereleases
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i += 1) {
    const [p, q] = [x.pre[i], y.pre[i]];
    if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
    if (p === q) continue;
    const [np, nq] = [/^\d+$/.test(p), /^\d+$/.test(q)];
    if (np && nq) return Number(p) - Number(q);
    return np !== nq ? (np ? -1 : 1) : p < q ? -1 : 1;
  }
  return 0;
}

/** The earliest published version whose release tag contains the pin, and the newest published one. */
export function computeFloor({ published, tagged, contains }) {
  const releases = published.filter((v) => VERSION.test(v)).sort(compareVersions);
  return { floor: releases.find((v) => tagged.has(v) && contains(v)) ?? null, newest: releases.at(-1) ?? null };
}

/** Fetch every spec release tag with its history (commits only) and answer containment of the pin. */
export function releaseTags(dir, url, pin) {
  const git = (args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  fs.mkdirSync(dir, { recursive: true });
  const steps = [['init', '-q', '--bare'], ['fetch', '-q', '--filter=tree:0', '--no-tags', url, `+refs/tags/${TAG_PREFIX}*:refs/tags/${TAG_PREFIX}*`]];
  for (const args of steps) {
    const r = git(args);
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || String(r.error)).trim()}`);
  }
  const refs = git(['for-each-ref', '--format=%(refname:lstrip=2)', `refs/tags/${TAG_PREFIX}*`]).stdout;
  const tagged = new Set(refs.split('\n').filter(Boolean).map((t) => t.slice(TAG_PREFIX.length)));
  const present = git(['cat-file', '-e', `${pin}^{commit}`]).status === 0;
  const contains = (version) => {
    if (!present) return false;
    const r = git(['merge-base', '--is-ancestor', pin, `refs/tags/${TAG_PREFIX}${version}`]);
    if (r.status !== 0 && r.status !== 1) throw new Error(`git merge-base --is-ancestor ${pin} ${TAG_PREFIX}${version}: ${r.stderr.trim()}`);
    return r.status === 0;
  };
  return { tagged, contains };
}

/** Every `@objectstack/*` range of every published manifest, judged against the floor. */
export function planRanges(packages, floor) {
  const rows = [];
  for (const pkg of packages) {
    for (const field of ALL_FIELDS) {
      for (const [name, from] of Object.entries(pkg.manifest[field] ?? {})) {
        if (!name.startsWith('@objectstack/')) continue;
        const min = RANGE.exec(String(from).trim())?.[1];
        const action = !min ? 'unreadable' : compareVersions(min, floor) < 0 ? 'moved' : 'kept';
        rows.push({ pkg, field, name, from, to: action === 'moved' ? `^${floor}` : from, action });
      }
    }
  }
  return rows;
}

/** CHANGELOG.md with a `### Dependency floors` entry under `## <version>` (added when absent). */
export function withFloorEntry(text, version, moved, floor, pin) {
  const entry =
    `### Dependency floors\n\nComputed from \`.objectstack-sha\` \`${pin.slice(0, 12)}\`: the earliest published ` +
    `\`${SPEC}\` that contains it is \`${floor}\`.\n\n` +
    moved.map((r) => `- \`${r.name}\` (\`${r.field}\`): \`${r.from}\` → \`${r.to}\`\n`).join('');
  const heading = `\n## ${version}\n`;
  const at = text.indexOf(heading);
  if (at === -1) {
    const cut = text.indexOf('\n') + 1;
    return `${text.slice(0, cut)}\n## ${version}\n\n${entry}${text.slice(cut)}`;
  }
  let cut = at + heading.length;
  if (text[cut] === '\n') cut += 1;
  return `${text.slice(0, cut)}${entry}\n${text.slice(cut)}`;
}

function npmJson(args) {
  const r = spawnSync('npm', [...args, '--json'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`npm ${args.join(' ')} failed: ${(r.stderr || r.stdout || String(r.error)).trim().slice(0, 400)}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}

export function main({ root = REPO_ROOT, argv = process.argv.slice(2), env = process.env, npm = npmJson } = {}) {
  const dryRun = argv.includes('--dry-run');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'objectstack-floor-'));
  try {
    const pin = readPin(root);
    const published = [].concat(npm(['view', SPEC, 'versions']) ?? []);
    const tags = releaseTags(path.join(scratch, 'objectstack.git'), env.OBJECTSTACK_REPO_URL || DEFAULT_REPO_URL, pin);
    const { floor, newest } = computeFloor({ published, ...tags });
    if (!floor) {
      console.error(
        `✗ No published ${SPEC} release contains the pin ${pin} (.objectstack-sha); the newest published ` +
          `release is ${newest}. Nothing is published until objectstack releases a commit that contains the pin.`,
      );
      return 2;
    }
    console.log(`Floor ${floor}: the earliest published ${SPEC} whose tag ${TAG_PREFIX}${floor} contains the pin ${pin}.`);
    const rows = planRanges(discoverPublishedPackages(root), floor);
    for (const r of rows) console.log(`  ${r.action.padEnd(10)} ${r.pkg.name}  ${r.field}  ${r.name}  ${r.from}${r.action === 'moved' ? ` → ${r.to}` : ''}`);
    const unreadable = rows.filter((r) => r.action === 'unreadable');
    if (unreadable.length) throw new Error(`${unreadable.length} range(s) above name no minimum this step can read; nothing was written.`);
    const moved = rows.filter((r) => r.action === 'moved');
    for (const name of new Set(moved.map((r) => r.name))) {
      if (npm(['view', `${name}@${floor}`, 'version']) !== floor) throw new Error(`npm does not carry ${name}@${floor}; nothing was written.`);
    }
    if (!dryRun) {
      for (const pkg of new Set(moved.map((r) => r.pkg))) {
        const mine = moved.filter((r) => r.pkg === pkg);
        for (const r of mine) pkg.manifest[r.field][r.name] = r.to;
        fs.writeFileSync(path.join(root, pkg.dir, 'package.json'), `${JSON.stringify(pkg.manifest, null, 2)}\n`);
        const changelog = path.join(root, pkg.dir, 'CHANGELOG.md');
        if (fs.existsSync(changelog)) fs.writeFileSync(changelog, withFloorEntry(fs.readFileSync(changelog, 'utf8'), pkg.manifest.version, mine, floor, pin));
      }
    }
    console.log(`${moved.length} range(s) moved to ^${floor}, ${rows.length - moved.length} left at or above it${dryRun ? ' (--dry-run: nothing written)' : ''}.`);
    return 0;
  } catch (error) {
    console.error(`✗ objectstack-floor: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

if (isEntrypoint(import.meta.url)) process.exitCode = main();
