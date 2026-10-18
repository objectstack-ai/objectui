/**
 * objectui#12957 — `scripts/bump-objectstack.sh`, driven as shipped over throwaway
 * git repositories: the refusal and warning contract it copies from objectstack's
 * `scripts/bump-objectui.sh`.
 *
 *   - a commit that cannot be resolved or read REFUSES before anything is written:
 *     `.objectstack-sha` stays byte-identical (the failed-run invariant);
 *   - a readable commit on `origin/main` is pinned with no warning;
 *   - a readable commit NOT on `origin/main` is pinned WITH a warning naming the
 *     branch it is on — a warning, never a refusal;
 *   - a checkout with no `origin/main` says the question is unanswered rather than
 *     answering it either way;
 *   - re-pinning the same commit writes nothing.
 *
 * The cases that pin a commit are the firing controls of the refusal cases: a
 * guard that refused everything would fail them.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(repoRoot, 'scripts/bump-objectstack.sh');
const OLD_PIN = 'a'.repeat(40);

// Anchored on the OS temp directory at module scope, so no path below can be
// read as relative to the process cwd (`pnpm check:test-path-roots`).
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-objectstack-'));

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${r.stderr}`);
  return r.stdout.trim();
}

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.invalid',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};

/** A fresh objectui-shaped directory holding the REAL script and an old pin. */
function makeObjectui(name: string): string {
  const dir = path.join(scratch, name, 'objectui');
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(dir, 'scripts/bump-objectstack.sh'));
  fs.writeFileSync(path.join(dir, '.objectstack-sha'), `${OLD_PIN}\n`);
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'init');
  return dir;
}

/** An objectstack checkout with `origin/main`, plus one commit on an unmerged local branch. */
function makeObjectstack(name: string, { withOrigin = true } = {}) {
  const base = path.join(scratch, name);
  const upstream = path.join(base, 'upstream');
  fs.mkdirSync(upstream, { recursive: true });
  git(upstream, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(upstream, 'VERSION.txt'), 'one\n');
  git(upstream, 'add', '.');
  git(upstream, 'commit', '-q', '-m', 'feat(spec): first');
  fs.writeFileSync(path.join(upstream, 'VERSION.txt'), 'two\n');
  git(upstream, 'commit', '-qam', 'feat(spec): second on main');
  const checkout = path.join(base, 'objectstack');
  if (withOrigin) {
    git(base, 'clone', '-q', upstream, checkout);
  } else {
    git(base, 'clone', '-q', '--no-local', upstream, checkout);
    git(checkout, 'remote', 'remove', 'origin');
  }
  const mainTip = git(checkout, 'rev-parse', 'HEAD');
  git(checkout, 'checkout', '-q', '-b', 'feature');
  fs.writeFileSync(path.join(checkout, 'VERSION.txt'), 'three\n');
  git(checkout, 'commit', '-qam', 'wip: not on main');
  const featureTip = git(checkout, 'rev-parse', 'HEAD');
  git(checkout, 'checkout', '-q', 'main');
  return { checkout, mainTip, featureTip };
}

function bump(objectui: string, objectstack: string, ...args: string[]) {
  return spawnSync('bash', [path.join(objectui, 'scripts/bump-objectstack.sh'), ...args], {
    cwd: objectui,
    encoding: 'utf8',
    env: { ...GIT_ENV, OBJECTSTACK_ROOT: objectstack },
  });
}

const pinOf = (objectui: string) => fs.readFileSync(path.join(objectui, '.objectstack-sha'), 'utf8');

afterAll(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

describe('scripts/bump-objectstack.sh (objectui#12957)', () => {
  it('pins a readable commit on origin/main, with no warning, and commits only the pin', () => {
    const { checkout, mainTip } = makeObjectstack('on-main');
    const objectui = makeObjectui('on-main');
    const r = bump(objectui, checkout, 'origin/main');
    expect(r.status, r.stderr).toBe(0);
    expect(pinOf(objectui)).toBe(`${mainTip}\n`);
    expect(r.stdout).toContain('(on origin/main)');
    expect(r.stderr).not.toContain('NOT reachable');
    expect(git(objectui, 'log', '-1', '--format=%s')).toBe(`chore: bump objectstack to ${mainTip.slice(0, 12)}`);
    expect(git(objectui, 'show', '--name-only', '--format=', 'HEAD')).toBe('.objectstack-sha');
  });

  it('WARNS, and still pins, a readable commit that is not on origin/main', () => {
    const { checkout, featureTip } = makeObjectstack('off-main');
    const objectui = makeObjectui('off-main');
    const r = bump(objectui, checkout, 'feature', '--no-commit');
    expect(r.status, r.stderr).toBe(0);
    expect(pinOf(objectui)).toBe(`${featureTip}\n`);
    expect(r.stderr).toContain(`objectstack pin ${featureTip.slice(0, 12)} is NOT reachable from origin/main`);
    expect(r.stderr).toContain('on local branches : feature');
    expect(r.stdout).toContain('--no-commit: leaving .objectstack-sha unstaged');
    expect(git(objectui, 'status', '--porcelain')).toBe('M .objectstack-sha');
  });

  it('says the question is UNANSWERED when the checkout has no origin/main', () => {
    const { checkout, mainTip } = makeObjectstack('no-origin', { withOrigin: false });
    const objectui = makeObjectui('no-origin');
    const r = bump(objectui, checkout, '--no-commit');
    expect(r.status, r.stderr).toBe(0);
    expect(pinOf(objectui)).toBe(`${mainTip}\n`);
    expect(r.stderr).toContain(`COULD NOT DETERMINE whether ${mainTip.slice(0, 12)} is on objectstack main`);
    expect(r.stderr).not.toContain('NOT reachable');
  });

  it('REFUSES a ref that does not resolve, and writes nothing', () => {
    const { checkout } = makeObjectstack('unresolvable');
    const objectui = makeObjectui('unresolvable');
    const r = bump(objectui, checkout, 'no-such-ref');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("REFUSING to bump: 'no-such-ref' does not resolve");
    expect(pinOf(objectui)).toBe(`${OLD_PIN}\n`);
    expect(git(objectui, 'status', '--porcelain')).toBe('');
  });

  it('REFUSES a commit whose object cannot be read, and writes nothing', () => {
    const { checkout, mainTip } = makeObjectstack('unreadable');
    const objectui = makeObjectui('unreadable');
    // Delete the loose object of HEAD's commit: `rev-parse HEAD` still resolves the
    // ref, the object behind it is gone.
    const objectFile = path.join(checkout, '.git/objects', mainTip.slice(0, 2), mainTip.slice(2));
    expect(fs.existsSync(objectFile), 'the commit must be a loose object for this case to mean anything').toBe(true);
    fs.rmSync(objectFile, { force: true });
    expect(spawnSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()).toBe(mainTip);
    const r = bump(objectui, checkout);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('REFUSING to bump');
    expect(r.stderr).toContain('NOTHING WAS WRITTEN');
    expect(pinOf(objectui)).toBe(`${OLD_PIN}\n`);
    expect(git(objectui, 'status', '--porcelain')).toBe('');
  });

  it('writes nothing when the commit is already the pin', () => {
    const { checkout, mainTip } = makeObjectstack('same');
    const objectui = makeObjectui('same');
    fs.writeFileSync(path.join(objectui, '.objectstack-sha'), `${mainTip}\n`);
    git(objectui, 'commit', '-qam', 'pin');
    const r = bump(objectui, checkout);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`Already at ${mainTip.slice(0, 12)} (on origin/main), nothing to do.`);
    expect(git(objectui, 'status', '--porcelain')).toBe('');
  });

  it('prints its help from the header and stops at the sentinel', () => {
    const r = spawnSync('bash', [SCRIPT, '--help'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Bump the objectstack commit this workspace builds @objectstack/* from.');
    expect(r.stdout).not.toContain('SENTINEL, not prose');
  });
});
