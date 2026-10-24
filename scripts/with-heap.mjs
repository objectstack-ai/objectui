#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * with-heap -- run a command with Node's old-space heap raised, cross-platform.
 *
 *   node ../../scripts/with-heap.mjs tsc --noEmit
 *   node ../../scripts/with-heap.mjs tsc -p tsconfig.test.json
 *
 * ## Why (objectstack ruling D1, the objectui-into-`ui/` merge)
 *
 * `@object-ui/app-shell` and `@object-ui/console` compile a program of several
 * thousand files, most of them `.d.ts`. Measured on the merge spike: `tsc`
 * over that program used 2.3 GB of heap and ran out of memory at Node's
 * default old-space limit inside the merged tree; standalone objectui sits
 * just under it. A `NODE_OPTIONS=… tsc` prefix in `package.json` is a bash
 * spelling that a Windows shell does not read, and `cross-env` is a dependency
 * this repository does not carry, so the flag is set here, by Node, for the
 * child only. The value is a CEILING, not an allocation: a run that needs less
 * uses less.
 *
 * A `NODE_OPTIONS` that already names `--max-old-space-size` (a CI job that set
 * its own, higher value) is kept as it is; this wrapper only adds the flag
 * when none is present. The child's exit code is the wrapper's exit code, and
 * a child killed by a signal exits 1 rather than 0 -- a wrapper that reported
 * success for a process it never saw finish would be worse than no wrapper.
 *
 * ⛔ Node builtins only: the `build` scripts that call this run in every CI
 * job, including ones that install nothing but the package closure.
 */

import { spawnSync } from 'node:child_process';

import { isEntrypoint } from './invoked-as.mjs';

export const HEAP_FLAG = '--max-old-space-size=4096';

/**
 * The `NODE_OPTIONS` the child receives: `existing` when it already sets an
 * old-space size, otherwise `existing` with the flag appended.
 *
 * @param {string | undefined} existing
 * @returns {string}
 */
export function nodeOptionsWithHeap(existing) {
  const current = (existing ?? '').trim();
  if (/(^|\s)--max-old-space-size(=|\s)/.test(current)) return current;
  return current ? `${current} ${HEAP_FLAG}` : HEAP_FLAG;
}

/**
 * @param {string[]} argv the command and its arguments
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number} the exit code to end with
 */
export function run(argv, env = process.env) {
  const [command, ...args] = argv;
  if (!command) {
    console.error('usage: node scripts/with-heap.mjs <command> [args...]');
    return 2;
  }
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...env, NODE_OPTIONS: nodeOptionsWithHeap(env.NODE_OPTIONS) },
    // `tsc` is a `.cmd` shim on Windows, which only a shell can start.
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`with-heap: could not start \`${command}\`: ${result.error.message}`);
    return 1;
  }
  if (result.status === null) {
    console.error(`with-heap: \`${command}\` ended by signal ${result.signal ?? 'unknown'}`);
    return 1;
  }
  return result.status;
}

if (isEntrypoint(import.meta.url)) process.exit(run(process.argv.slice(2)));
