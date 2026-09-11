#!/usr/bin/env node
/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Every key taught on a `**Keys:**` bullet in `.github/prompts/**` must be
 * answered by a REAL renderer — not only by the opt-in protocol placeholder
 * (objectui#8929).
 *
 *   Run:  node scripts/check-prompt-component-keys.mjs   (`pnpm check:prompt-keys`)
 *   Exit: 0 = every taught key resolves to a real component
 *         1 = a taught key resolves to nothing, or resolves only to the
 *             placeholder panel, or this gate's own derivation collapsed
 *
 * ## The defect, and why the obvious fix is a no-op
 *
 * `.github/prompts/**` is read by an AI that then writes metadata. A stale key
 * there is not one wrong page: it is every generated document reaching for a
 * key the registry no longer answers with anything renderable.
 *
 * The card that opened this gate found two such keys on one bullet, `view:kanban`
 * and `view:gantt`, retired with the bare `kanban` / `gantt` registrations
 * (objectui#8802, objectui#8008). The instinctive fixes both fail:
 *
 *   DELETE THE TWO   a hand list that drifted once drifts again, which is the
 *                    reason the card was filed rather than patched.
 *   RE-DERIVE FROM   `known-schema-types.ts` STILL CONTAINS BOTH. They are
 *   THE GENERATED    members of `PROTOCOL_COMPONENTS`, and `registerPlaceholder`
 *   KNOWN-TYPE LIST  is a real `ComponentRegistry.register(...)` call. So the
 *                    generated list answers "yes" and the correction is a no-op.
 *
 * The two sets differ, and naming the difference is this gate:
 *
 *   what RESOLVES   every registered key, placeholders included. That is the
 *                   question `objectui check` asks, and asking it of a prompt
 *                   is what let `view:kanban` validate green and draw nothing.
 *   what is AUTHORABLE  a key some registration OTHER than the protocol
 *                   placeholder answers. That is the question a prompt teaching
 *                   an author must ask.
 *
 * ## Where the exclusion comes from — the placeholder module's own declaration
 *
 * ⛔ NOT from a list of key names typed here; that list is the drift this gate
 * exists about. The universe comes from `deriveRegistryKeys` — the SAME
 * derivation that judges documentation snippets (objectui#4823) and generates
 * the CLI's known-type list (objectui#5115) — which records, per key, the SITES
 * that register it. `INDIRECT_REGISTRATIONS` declares the placeholder module
 * and the `protocol-placeholder` namespace it registers under; a key whose
 * every site is that module is placeholder-only, and every other key is
 * authorable. Move a key out of `PROTOCOL_COMPONENTS` into a real plugin and
 * this gate follows it live, with nothing here to edit.
 *
 * If that declaration ever stops naming a `protocol-placeholder` entry, or the
 * exclusion stops removing anything, the run FAILS rather than passing: an
 * exclusion that excludes nothing silently collapses this gate back into the
 * generous question, which is the no-op above.
 *
 * ## What is deliberately NOT checked: completeness
 *
 * The bullets end in `etc.` — they are examples, and the file makes no claim to
 * enumerate the registry. So the direction judged is containment: what the
 * prompt names must exist and must render. The other direction (a new renderer
 * lands, the prompt does not mention it) leaves the prompt incomplete, never
 * WRONG, and gating it would red on every plugin that ships.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deriveRegistryKeys, INDIRECT_REGISTRATIONS } from './check-doc-component-types.mjs';
import { isEntrypoint } from './invoked-as.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));

/** The instruction surface this gate reads. */
export const PROMPT_DIR = '.github/prompts';

/** The namespace `INDIRECT_REGISTRATIONS` gives the opt-in placeholder module. */
export const PLACEHOLDER_NAMESPACE = 'protocol-placeholder';

/**
 * A bullet that teaches registry keys. Anchored on the bolded `Keys:` label
 * rather than on a namespace prefix: the surviving spelling of a retired
 * namespaced key is often a BARE one (`object-kanban` for `view:kanban`), so a
 * scanner keyed on `ns:key` would stop reading the bullet at the moment it is
 * corrected.
 */
const KEYS_BULLET = /^\s*[*-]\s+\*\*Keys:\*\*\s*(.*)$/;

/** A single-backticked token inside a bullet.
 *
 *  Read from the `**Keys:**` LINE only, never from the bullet's continuation or
 *  its sub-bullets: those carry prose about the keys — the `formType` values a
 *  form view takes, for instance — and judging a prop value as a registry key
 *  would red on correct text. The convention that makes this safe is stated in
 *  the file it reads: a Keys bullet's keys live on the Keys line. */
const BACKTICKED = /`([^`]+)`/g;

/** Files the prompt surface is made of. */
const PROMPT_EXTENSIONS = ['.md'];

/** Which registration sites belong to the opt-in protocol placeholder. */
export function placeholderSites(indirect = INDIRECT_REGISTRATIONS) {
  return new Set(indirect.filter((e) => e.namespace === PLACEHOLDER_NAMESPACE).map((e) => e.site));
}

/**
 * Split the derived universe into the keys a real renderer answers and the keys
 * only the placeholder answers.
 */
export function partitionRegistry(keys, sites) {
  const authorable = new Set();
  const placeholderOnly = new Set();
  for (const [key, keySites] of keys) {
    if (keySites.some((site) => !sites.has(site))) authorable.add(key);
    else placeholderOnly.add(key);
  }
  return { authorable, placeholderOnly };
}

/** Every prompt file, sorted so output order does not depend on the filesystem. */
export function promptFiles(root) {
  const dir = join(root, PROMPT_DIR);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((name) => PROMPT_EXTENSIONS.some((ext) => name.endsWith(ext)))
    .sort()
    .map((name) => join(dir, name));
}

/** Every key taught on a `Keys:` bullet, with the file and bullet text. */
export function scanPromptKeys(root) {
  const sites = [];
  let bullets = 0;
  for (const abs of promptFiles(root)) {
    const rel = relative(root, abs).split(sep).join('/');
    const lines = readFileSync(abs, 'utf8').split('\n');
    for (const line of lines) {
      const bullet = KEYS_BULLET.exec(line);
      if (!bullet) continue;
      bullets++;
      BACKTICKED.lastIndex = 0;
      let token;
      while ((token = BACKTICKED.exec(bullet[1]))) {
        sites.push({ file: rel, key: token[1], text: line.trim() });
      }
    }
  }
  return { sites, bullets };
}

/**
 * Judge the prompt surface. Throws when an input is missing, because a gate
 * that cannot see its inputs must not report a pass.
 */
export function analyze(root, options = {}) {
  const registry = deriveRegistryKeys(root, options);
  if (registry.findings.length > 0) {
    const lines = registry.findings.map((f) => `  ${f.reason} at ${f.site}: ${f.detail}`);
    throw new Error(
      `the registry derivation reported ${registry.findings.length} finding(s), so the key universe ` +
        `is incomplete and a green verdict here would have judged against a short list:\n${lines.join('\n')}`,
    );
  }

  const sites = placeholderSites(options.indirectRegistrations ?? INDIRECT_REGISTRATIONS);
  if (sites.size === 0) {
    throw new Error(
      `no INDIRECT_REGISTRATIONS entry declares the \`${PLACEHOLDER_NAMESPACE}\` namespace, so this ` +
        'gate cannot tell a real renderer from a placeholder. Without that distinction it collapses ' +
        'into "does the key resolve", which is the question that let a retired key validate green.',
    );
  }

  const { authorable, placeholderOnly } = partitionRegistry(registry.keys, sites);
  if (placeholderOnly.size === 0) {
    throw new Error(
      'the placeholder exclusion removed no keys at all. Either the placeholder module stopped ' +
        'registering, or its declared site no longer matches the sites the derivation records — ' +
        'either way this run would have asked the generous question while reporting the strict one.',
    );
  }
  if (authorable.size === 0) {
    throw new Error('the derivation produced no authorable keys — refusing to judge against an empty set.');
  }

  const { sites: taught, bullets } = scanPromptKeys(root);
  if (bullets === 0) {
    throw new Error(
      `no \`**Keys:**\` bullet was found under ${PROMPT_DIR}. The surface this gate reads is gone or ` +
        'has been reformatted, and a run that reads nothing passes while asserting nothing.',
    );
  }

  const findings = [];
  for (const site of taught) {
    if (authorable.has(site.key)) continue;
    findings.push({
      ...site,
      reason: placeholderOnly.has(site.key) ? 'placeholder-only-key' : 'unregistered-key',
    });
  }

  return {
    findings,
    counters: {
      promptFiles: promptFiles(root).length,
      bullets,
      keys: taught.length,
      registryKeys: registry.keys.size,
      authorable: authorable.size,
      placeholderOnly: placeholderOnly.size,
    },
  };
}

const HINTS = {
  'placeholder-only-key':
    'This key IS registered — by the opt-in protocol placeholder and by nothing else. A document ' +
    'naming it passes `objectui check` and then paints the dashed placeholder panel in apps/console, ' +
    'or the OBJUI-001 "Unknown component type" panel in every host that does not call ' +
    '`registerPlaceholders()`. Teach the key of the component that actually renders, or, if none ' +
    'exists yet, do not teach it at all.',
  'unregistered-key':
    'Nothing in this repository registers this key, so it resolves to the OBJUI-001 "Unknown ' +
    'component type" panel everywhere. Teach a registered key.',
};

if (isEntrypoint(import.meta.url)) {
  const argOf = (name) => {
    const index = process.argv.indexOf(name);
    return index > -1 ? process.argv[index + 1] : null;
  };
  const root = resolve(argOf('--root') ?? resolve(scriptDir, '..'));

  let result;
  try {
    result = analyze(root);
  } catch (error) {
    console.error(
      `x  ${error.message}\n\n` +
        '    Reported as a failure rather than a pass: this gate decides whether an AI instruction file ' +
        'teaches\n    keys that render, so losing an input means it cannot decide.',
    );
    process.exit(1);
  }

  const { findings, counters } = result;
  console.log(
    `Scanned ${counters.promptFiles} prompt file(s) under ${PROMPT_DIR}, ` +
      `${counters.bullets} \`Keys:\` bullet(s), ${counters.keys} taught key(s) against ` +
      `${counters.authorable} authorable key(s) — the ${counters.registryKeys} registered key(s) less ` +
      `the ${counters.placeholderOnly} answered only by the ${PLACEHOLDER_NAMESPACE} registration.`,
  );

  if (findings.length === 0) {
    console.log('OK  Every key taught on a `Keys:` bullet is answered by a real renderer.');
    process.exit(0);
  }

  console.error(`\nX  ${findings.length} problem(s):\n`);
  for (const finding of findings) {
    console.error(`      ${finding.file}  [${finding.reason}]  \`${finding.key}\``);
    console.error(`          ${finding.text}`);
  }
  for (const reason of Object.keys(HINTS)) {
    if (findings.some((f) => f.reason === reason)) console.error(`\n${reason}: ${HINTS[reason]}`);
  }
  console.error(
    '\nThese files are read by an AI that then writes metadata, so a key here that does not render is ' +
      'not one\nwrong page — it is every document generated from it. See the header of ' +
      'scripts/check-prompt-component-keys.mjs (objectui#8929).',
  );
  process.exit(1);
}
