import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * objectui#9538 — the stale-entry message in `scripts/check-lint-coverage.mjs`
 * spelled a GitHub closing keyword immediately in front of the issue number it
 * interpolates.
 *
 * ## Why a message's WORDING gets a pin at all
 *
 * That message is written to be QUOTED. The discipline around a `DEBT` entry is
 * to take the INTERMEDIATE reading — the package linted, the entry not yet
 * deleted — and paste the gate's own output into the pull request as proof the
 * work landed. A closing keyword in front of the number therefore does not stay
 * in the script: it travels into a pull-request body, and on merge it ends the
 * anchor card silently, from a body whose author was being careful. GitHub's
 * parser does no sentence parsing, so no hedging in the surrounding sentence
 * reaches it. The reason is written at the ratchet that emits the message; this
 * file is what makes the constraint fail loudly instead of being remembered.
 *
 * The landed precedent is the rule-2 stale-entry message in
 * `scripts/check-spec-symbol-derivation.mjs`, pinned by the
 * `the stale-entry message may not carry a card-closing keyword` block in
 * `scripts/__tests__/spec-symbol-ledger-plugin-detail-7265.test.ts` — cited by
 * the names of the things, not by line address (root `AGENTS.md`, commandment
 * #11).
 *
 * ## Why this file RENDERS the message instead of reading the source text
 *
 * `DEBT` is `{}` in this tree, so the ratchet that emits this message cannot
 * fire here and the quotable string exists nowhere to be asserted against. A
 * source-text assertion is the precedent's answer and is kept below as the
 * cheap leg, but on its own it pins a template, not the sentence a contributor
 * would paste. So the harness copies the REAL gate into a throwaway tree with
 * the one thing that keeps it quiet — the empty `DEBT` — substituted, and reads
 * what the gate actually prints.
 *
 * ⚠️ Every leg here is paired with a control that MUST fire. A regex that
 * matches nothing renders exactly like a message that carries nothing, and a
 * substitution that silently matched no text renders exactly like a clean run.
 * Both are asserted rather than assumed.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gateSource = path.join(repoRoot, 'scripts/check-lint-coverage.mjs');

/** The seam the harness substitutes to make the ratchet reachable. */
const EMPTY_LEDGER = 'const DEBT = {};';

/**
 * A deliberately meaningless anchor. It has to be TRUTHY — the tail is guarded
 * by `DEBT[name].issue ? … : ""`, so a zero would render nothing and every
 * assertion below would pass over an empty string.
 */
const FIXTURE_ANCHOR = 424242;

/**
 * GitHub's closing-keyword grammar as root `AGENTS.md` states the mitigation:
 * one of the keywords immediately before an issue reference, in any tense, with
 * no sentence parsing of any kind. The optional `objectui` / `objectstack` /
 * `owner/repo` alternatives are there because the shape is what is being kept
 * out, not only the subset GitHub resolves today.
 */
const CLOSING_TRIGGER =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:[A-Za-z0-9-]+\/[A-Za-z0-9-]+|objectui|objectstack)?#(?:\$\{|\d)/i;

/** The rule-2 ratchet, from its banner comment to the report banner after it. */
function staleEntryRatchet(): string {
  const text = fs.readFileSync(gateSource, 'utf8');
  const start = text.indexOf('// 2. Ratchet — a declared gap that has been closed');
  expect(start, "rule 2's ratchet banner is gone").toBeGreaterThan(-1);
  const end = text.indexOf('// ── Report', start);
  expect(end, 'the report banner after the ratchet is gone').toBeGreaterThan(start);
  return text.slice(start, end);
}

/**
 * Runs the REAL gate over a throwaway workspace whose one package is both
 * declared in `DEBT` and already linted — the exact state rule 2 exists to
 * report — and returns everything it printed.
 *
 * `rewrite` lets a control leg put the PRE-repair wording back, so the pipeline
 * (substitute, spawn, render, match) is proven able to go red on the same run
 * path that reports green for the live wording.
 */
function renderStaleEntry(rewrite: (source: string) => string = (source) => source): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-coverage-anchor-'));
  try {
    const original = fs.readFileSync(gateSource, 'utf8');
    const rewritten = rewrite(original);
    const seeded = rewritten.replace(
      EMPTY_LEDGER,
      `const DEBT = { "@fixture/demo": { errors: 1, issue: ${FIXTURE_ANCHOR} } };`,
    );
    expect(seeded, `the \`${EMPTY_LEDGER}\` seam this harness substitutes is gone`).not.toBe(rewritten);

    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'scripts', 'gate.mjs'), seeded);
    fs.mkdirSync(path.join(dir, 'packages', 'demo'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'packages', 'demo', 'package.json'),
      JSON.stringify({ name: '@fixture/demo', version: '0.0.0', private: true, scripts: { lint: 'eslint .' } }),
    );

    const run = spawnSync(process.execPath, [path.join(dir, 'scripts', 'gate.mjs')], { encoding: 'utf8' });
    const printed = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    expect(run.status, `the seeded gate did not report a stale entry:\n${printed}`).toBe(1);
    expect(printed, "rule 2's message did not reach the output").toContain('now has a "lint" script');
    return printed;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('the stale-entry message may not carry a card-closing keyword', () => {
  it('the harness and the regex can both fire — the control, on the wording this card replaced', () => {
    // ⛔ Without this leg every assertion below is unfalsifiable: a substitution
    // that matched nothing, a gate that printed nothing, and a regex that
    // matches nothing all render identically to a clean message.
    //
    // The pre-repair spelling is written here as a template interpolation,
    // byte for byte as the tail carried it. That form can never resolve to an
    // issue reference in a rendered body, so restoring it in this file plants
    // no live trigger — while the rendered leg below proves the regex also
    // catches the resolved form.
    const rendered = renderStaleEntry((source) => {
      const restored = source.replace(
        '`${DEBT[name].issue ? `, and objectui#${DEBT[name].issue} can be ended once that work is done` : ""}.`',
        '`${DEBT[name].issue ? ` (and close #${DEBT[name].issue} if it is done)` : ""}.`',
      );
      expect(restored, 'the live tail this control rewrites is gone').not.toBe(source);
      return restored;
    });

    expect(rendered).toContain(`close #${FIXTURE_ANCHOR}`);
    expect(CLOSING_TRIGGER.test(rendered)).toBe(true);
    expect(CLOSING_TRIGGER.test('(and close #${DEBT[name].issue} if it is done)')).toBe(true);
  });

  it('…and the message the gate actually prints carries no trigger', () => {
    expect(
      CLOSING_TRIGGER.test(renderStaleEntry()),
      "the stale-entry message has a GitHub closing keyword in front of an issue reference again. "
        + 'This text is quoted into pull-request bodies by design — quoting the intermediate reading is '
        + 'the standing discipline for burning down a DEBT entry — so a keyword here ends the anchor '
        + 'card on merge. The reason is written at the ratchet that emits it.',
    ).toBe(false);
  });

  it('…while still telling the reader what to do with the anchor', () => {
    // The positive half, so "no trigger" cannot be satisfied by deleting the
    // instruction outright.
    const rendered = renderStaleEntry();
    expect(rendered).toContain(`objectui#${FIXTURE_ANCHOR}`);
    expect(rendered).toContain('can be ended once that work is done');
  });

  it('the ratchet SOURCE carries no trigger either, comment included', () => {
    // The cheap leg, and not a duplicate of the rendered one: it also covers the
    // prose beside the emitter, which reaches a reader who is deciding how to
    // word the next entry.
    expect(CLOSING_TRIGGER.test(staleEntryRatchet())).toBe(false);
  });
});
