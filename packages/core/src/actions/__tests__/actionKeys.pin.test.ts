/**
 * Pins the key inventory in `actionKeys.ts` to the two things it mirrors —
 * `ActionDef`'s own declarations and `@objectstack/spec`'s `ActionSchema`
 * (objectstack#4075 step 1).
 *
 * Why a test rather than a comment: a hand-maintained list that silently drifts
 * from the interface it claims to mirror is the exact "declared ≠ enforced"
 * failure this work is about. `ActionDef` cannot be enumerated at runtime — the
 * interface and its `keyof` are both erased before anything runs — so the list is
 * data, and this file is what makes the data true. Adding a field to `ActionDef`
 * without adding it here fails, by name.
 *
 * Discrimination proof for the guard below: with `ACTION_DEF_KEYS` complete these
 * pass; dropping any single entry (e.g. `target`) fails with
 * "ActionDef declares keys the inventory is missing: target".
 *
 * ## OWED TO objectui#11344 — a bounded ledger, not a skip
 *
 * `@objectstack/spec` 17.6.0's `ActionSchema` declares `outcomeMessages`, and
 * objectui does not read it yet: objectui#11344 builds the reader and lists the
 * key with it. Until then the key is booked in `OWED_TO_OBJECTUI_11344` below.
 * Its row asserts today's difference, and "lists every key the spec
 * ActionSchema declares" requires `missing` to EQUAL the ledger exactly, so a
 * new spec key is red, and so is the booked key once objectui lists it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { ActionSchema as SpecActionSchema } from '@objectstack/spec/ui';
// The Zod wrapper-key vocabulary — one list, read by the `.mjs` CI gates that
// walk the same internals (objectui#6923, ruled 2026-08-31).
import { ZOD_WRAPPER_KEYS } from '@object-ui/test-support';
import {
  ACTION_DEF_KEYS,
  SPEC_ACTION_KEYS,
  NAVIGATION_ALIAS_KEYS,
  HOST_DISPATCH_ACTION_KEYS,
  RETIRED_ACTION_KEYS,
  KNOWN_ACTION_KEYS,
  classifyActionKeys,
  warnOnUnknownActionKeys,
  resetActionKeyWarnings,
} from '../actionKeys';

const RUNNER = join(dirname(fileURLToPath(import.meta.url)), '..', 'ActionRunner.ts');

/** The named interface's members, read off `ActionRunner.ts` itself. */
function interfaceMembers(name: string): readonly ts.TypeElement[] {
  const sf = ts.createSourceFile(RUNNER, readFileSync(RUNNER, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) && stmt.name.text === name) return stmt.members;
  }
  throw new Error(`${name} interface not found in ActionRunner.ts`);
}

/** `ActionDef`'s declared property names, read off the interface itself. */
function declaredActionDefKeys(): string[] {
  return interfaceMembers('ActionDef')
    .filter(ts.isPropertySignature)
    .map((m) => (m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : null))
    .filter((n): n is string => n !== null);
}

/** Does the named interface end with an `[key: string]: any`-style catch-all? */
function hasIndexSignature(name: string): boolean {
  return interfaceMembers(name).some(ts.isIndexSignatureDeclaration);
}

/**
 * The spec's `ActionSchema` keys. `ActionSchema` is a lazy proxy that does not
 * forward `.shape`, so this walks zod internals to reach the object shape —
 * acceptable HERE (a test pins a fact) and deliberately not done in shipped code.
 */
function specActionKeys(): string[] {
  const seen = new Set<unknown>();
  const walk = (schema: unknown, depth = 0): string[] | null => {
    if (!schema || depth > 8 || seen.has(schema)) return null;
    seen.add(schema);
    const s = schema as Record<string, unknown>;
    const shapeOf = (v: unknown): string[] | null =>
      v && typeof v === 'object' ? Object.keys(v as object) : null;
    if (s.shape) return shapeOf(s.shape);
    const def = (s._def ?? s.def) as Record<string, unknown> | undefined;
    if (!def) return null;
    if (def.shape) return shapeOf(def.shape);
    for (const key of ZOD_WRAPPER_KEYS) {
      const found = def[key] ? walk(def[key], depth + 1) : null;
      if (found) return found;
    }
    return null;
  };
  const keys = walk(SpecActionSchema);
  if (!keys) throw new Error('could not resolve @objectstack/spec/ui ActionSchema shape');
  return keys;
}

/**
 * ⚠️ OWED TO objectui#11344 — the spec `ActionSchema` keys objectui's inventory
 * does NOT list yet, booked rather than skipped.
 *
 * `@objectstack/spec` 17.6.0 declares `outcomeMessages` on `ActionSchema`
 * (objectstack#21095): success copy per handler outcome, and the spec's own
 * landing order names objectui#11344 as its console reader. objectui does not
 * read it yet, so `SPEC_ACTION_KEYS` does not list it and the runner's
 * unknown-key warning still names it. objectui#11344 owns the reader, and lists
 * the key in the same change.
 *
 * Booked by objectui#11438 ruling A″ (record 5968177777), which applies
 * objectui#11111 decision 3 = B (record 5902351047) to the bump. The listed
 * key's row asserts TODAY's difference (the spec declares it; objectui's
 * inventory does not know it), and "lists every key the spec ActionSchema
 * declares" requires `missing` to EQUAL this list, with `stale` still empty. A
 * new spec key is red, and so is a listed key objectui starts knowing: the
 * entry goes stale, by name, when objectui#11344's reader lands, and that change
 * strikes it.
 *
 * EXPIRES when objectui#11344's slice lands, or 2026-11-02, whichever is first.
 * The landing is caught by the rows below going red; the date is read by
 * objectui#11344, not by a clock.
 */
const OWED_TO_OBJECTUI_11344 = ['outcomeMessages'];

/** The reason every owed row prints when it fails. */
const OWED_REASON =
  'OWED TO objectui#11344: objectui does not read the spec ActionSchema key yet, so the inventory does not list it. ' +
  'Booked by objectui#11438 ruling A″ (record 5968177777), applying objectui#11111 decision 3 = B ' +
  '(record 5902351047). Expires when objectui#11344\'s slice lands, or 2026-11-02, whichever is first.';

describe('action key inventory (objectstack#4075 step 1)', () => {
  it('ActionDef has NO index signature, and ActionContext still does', () => {
    // The successor to step 1's inverted pin. That one asserted the index
    // signature was STILL THERE and named its own retirement condition: "the day
    // this fails, step 3 has landed". Step 3 landed, so the assertion inverts
    // rather than disappears — the property is still worth pinning, in the
    // opposite direction, and silently deleting the pin would have left the
    // deletion unguarded against a well-meaning re-add.
    //
    // Asserted through the AST, not `toContain('[key: string]: any')` as the
    // original did. A whole-file text match cannot tell the DECLARATION from
    // prose ABOUT it, and both files now discuss the index signature at length;
    // a text-negative pin would go red on a comment. It would also have been
    // blind to the half of this assertion that carries the real discrimination:
    // `ActionContext` KEEPING its own index signature. The card turns on that
    // asymmetry — a runtime data bag is legitimately open, a declared metadata
    // contract is not — so a pin that only checked `ActionDef` would stay green
    // through a change that "tidied up" `ActionContext` too.
    expect({
      ActionDef: hasIndexSignature('ActionDef'),
      ActionContext: hasIndexSignature('ActionContext'),
    }).toEqual({ ActionDef: false, ActionContext: true });
  });

  it('lists every key ActionDef declares', () => {
    const declared = declaredActionDefKeys();
    const missing = declared.filter((k) => !(ACTION_DEF_KEYS as readonly string[]).includes(k));
    const stale = (ACTION_DEF_KEYS as readonly string[]).filter((k) => !declared.includes(k));
    expect({ missing, stale }).toEqual({ missing: [], stale: [] });
  });

  it('lists every key the spec ActionSchema declares', () => {
    const spec = specActionKeys();
    const missing = spec.filter((k) => !(SPEC_ACTION_KEYS as readonly string[]).includes(k));
    const stale = (SPEC_ACTION_KEYS as readonly string[]).filter((k) => !spec.includes(k));
    // `missing` means the spec grew a key objectui does not know about; `stale`
    // means it dropped one. Either way the inventory has to be re-derived, and
    // the diff names exactly which key moved. The one exception is the booked
    // ledger: `missing` must EQUAL `OWED_TO_OBJECTUI_11344`, not merely contain
    // it, so the booking cannot outlive the reader that strikes it.
    expect({ missing: [...missing].sort(), stale }, OWED_REASON).toEqual({
      missing: [...OWED_TO_OBJECTUI_11344].sort(),
      stale: [],
    });
  });

  it('`execute` is still a live spec tombstone, so it must not count as known', () => {
    const parsed = SpecActionSchema.safeParse({
      name: 'mark_done',
      label: 'Mark Done',
      type: 'script',
      execute: 'markDone',
    });
    expect(parsed.success).toBe(false);
    expect(RETIRED_ACTION_KEYS).toHaveProperty('execute');
    expect(KNOWN_ACTION_KEYS.has('execute')).toBe(false);
  });

  it('pins the host-dispatch list EXACTLY, because its set is the ruling', () => {
    // Exact contents, not `toContain`. The maintainer ruling of 2026-08-22
    // authorized ONE key here, and the danger this list carries is growth: a
    // key in it is a key the unknown-key warning stops asking about, so a
    // silent addition is a silent hole in the diagnostic. `toEqual` on the whole
    // array is what makes adding a second member a red test that names it,
    // rather than an edit nobody reads.
    expect([...HOST_DISPATCH_ACTION_KEYS]).toEqual(['overrideNotice']);
  });

  it('counts the host-dispatch key as known, so the dev warning stops crying wolf', () => {
    // The defect item 4 closes: `DeclaredActionsBar` composes `overrideNotice`
    // on the dispatch, `useConsoleActionRuntime` and `RecordDetailView` read
    // it, and the runner — which classifies the DISPATCH, not the stored row —
    // called it a key "no reader recognizes".
    expect(KNOWN_ACTION_KEYS.has('overrideNotice')).toBe(true);
  });

  it('does NOT let the host-dispatch key onto the authored surface', () => {
    // The other half of the same ruling, and the half that has to stay true
    // while the half above changes: ⛔ not declared on `ActionDef`, ⛔ not in
    // `ACTION_DEF_KEYS`. Membership in `KNOWN_ACTION_KEYS` widens what the
    // dev-mode WARNING tolerates; it must not widen what an author may WRITE.
    // Read off the interface's AST, so re-declaring the key on `ActionDef` to
    // "make it consistent" fails here by name.
    expect({
      declaredOnActionDef: declaredActionDefKeys().includes('overrideNotice'),
      inActionDefKeys: (ACTION_DEF_KEYS as readonly string[]).includes('overrideNotice'),
      inSpecActionKeys: (SPEC_ACTION_KEYS as readonly string[]).includes('overrideNotice'),
    }).toEqual({ declaredOnActionDef: false, inActionDefKeys: false, inSpecActionKeys: false });
  });

  it('keeps the navigation alias out of the spec vocabulary it is not part of', () => {
    // If the spec ever adopts one of these, it stops being objectui dialect and
    // this fails — naming the alias to retire, the same tripwire shape as
    // `ObjectUiLocalActionType`.
    const spec = specActionKeys();
    expect(NAVIGATION_ALIAS_KEYS.filter((k) => spec.includes(k))).toEqual([]);
  });
});

describe('objectui#11344 — OWED: the spec ActionSchema declares these keys and objectui does not know them today', () => {
  it.each(OWED_TO_OBJECTUI_11344)('OWED TO objectui#11344: `%s` is declared by the spec ActionSchema, and neither the inventory nor the runner knows it', (key) => {
    // All three halves are asserted together. The first keeps the ledger
    // honest: a key the spec does not declare is not owed to anyone. The other
    // two are the difference: `SPEC_ACTION_KEYS` is the inventory the cap row
    // reads, and `KNOWN_ACTION_KEYS` is what the unknown-key warning reads, so a
    // reader that lists the key on either side turns this row red.
    expect(
      {
        declaredBySpec: specActionKeys().includes(key),
        inSpecActionKeys: (SPEC_ACTION_KEYS as readonly string[]).includes(key),
        knownToTheRunner: KNOWN_ACTION_KEYS.has(key),
      },
      OWED_REASON,
    ).toEqual({ declaredBySpec: true, inSpecActionKeys: false, knownToTheRunner: false });
  });
});

describe('unknown-key warning', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetActionKeyWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('says nothing about an action built only from recognized keys', () => {
    warnOnUnknownActionKeys({ name: 'save', type: 'api', target: '/api/v1/save', locations: ['record_header'] });
    expect(warn).not.toHaveBeenCalled();
  });

  it('names a typo that the compiler cannot see', () => {
    // `targt` no longer type-checks in an action literal — `actionDef-closed-surface.test.ts`
    // pins that rejection. It is still invisible to the compiler in the population
    // THIS warning serves: an action rehydrated from a stored row, which reaches
    // the runner unparsed (objectstack#3903). Nothing reads it, so the action runs
    // and does nothing — #2169's shape.
    warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'saveRecord' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('`targt`');
  });

  it('sends the author to the interface, and drops the reason step 3 retired', () => {
    // The message is author-facing prose that PRESCRIBES AN EDIT, and both halves
    // of it rotted unnoticed (objectui#5642): it claimed `ActionDef` "still
    // carries `[key: string]: any`" after step 3 deleted it, and it named the
    // INVENTORY as the place to declare a field that lives on the INTERFACE —
    // which is exactly the half-change the `missing`/`stale` pins above go red on.
    // Unpinned prose is how that survived; this is the pin.
    warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'saveRecord' });
    const message = String(warn.mock.calls[0][0]);
    expect({
      pointsAtTheInterfaceFile: message.includes('packages/core/src/actions/ActionRunner.ts'),
      namesTheSecondEdit: message.includes('`ACTION_DEF_KEYS`'),
      repeatsTheRetiredIndexSignature: message.includes('[key: string]: any'),
    }).toEqual({
      pointsAtTheInterfaceFile: true,
      namesTheSecondEdit: true,
      repeatsTheRetiredIndexSignature: false,
    });
  });

  it('the file path it prints really declares the interface it prescribes', () => {
    // A fix for a wrong pointer that quietly installs another wrong pointer is
    // the same defect. So resolve the path OFF THE PRINTED MESSAGE and read the
    // file: a rename or a move of `ActionRunner.ts` reddens here by name instead
    // of shipping a second dead prescription.
    warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'saveRecord' });
    const message = String(warn.mock.calls[0][0]);
    const printed = [...(message.match(/packages\/core\/src\/actions\/[A-Za-z.]+\.ts(?=\))/g) ?? [])];
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
    const declaringPaths = printed.filter((p) =>
      readFileSync(join(repoRoot, p), 'utf8').includes('export interface ActionDef {'));
    expect({ printed, declaringPaths }).toEqual({
      printed: ['packages/core/src/actions/ActionRunner.ts', 'packages/core/src/actions/actionKeys.ts'],
      declaringPaths: ['packages/core/src/actions/ActionRunner.ts'],
    });
  });

  it('gives a retired key its rename prescription, not a bare "unknown"', () => {
    warnOnUnknownActionKeys({ name: 'mark_done', type: 'script', execute: 'markDone' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('rename the key to `target`');
  });

  it('warns once per action, not once per click', () => {
    for (let i = 0; i < 5; i++) warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'x' });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('still names a SECOND action carrying the same typo', () => {
    // Keying the warn-once memo on the keys alone would report `save` and stay
    // silent about `remove` — sending the author to fix the first symptom only.
    warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'x' });
    warnOnUnknownActionKeys({ name: 'remove', type: 'script', targt: 'y' });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('"remove"');
  });

  it('says nothing about the dispatch a console host actually composes', () => {
    // The exact object literal at `DeclaredActionsBar.tsx`'s override branch,
    // reduced to the keys that decide the verdict. Before item 4 this produced
    // one warning naming `overrideNotice`, on the one privileged path that
    // finalises an approval over approvers who have not acted.
    warnOnUnknownActionKeys({
      name: 'approval_reject',
      type: 'api',
      target: '/api/v1/approvals/{id}/reject',
      label: 'Reject (override)',
      objectName: 'approval_request',
      params: { _rowRecord: { id: 'a1' } },
      overrideNotice: 'You are overriding 2 approvers who have not acted.',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('still names a typo riding the SAME host dispatch', () => {
    // The discrimination half: the fix must silence one key, not the check.
    // Without this, replacing `classifyActionKeys` with `() => ({unknown: [],
    // retired: []})` would pass the test above.
    warnOnUnknownActionKeys({
      name: 'approval_reject',
      type: 'api',
      overrideNotice: 'You are overriding 2 approvers who have not acted.',
      targt: '/api/v1/approvals/{id}/reject',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('`targt`');
    expect(warn.mock.calls[0][0]).not.toContain('overrideNotice');
  });

  it('is silent in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      warnOnUnknownActionKeys({ name: 'save', type: 'script', targt: 'x' });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('classifies unknown and retired keys separately', () => {
    expect(classifyActionKeys({ type: 'script', execute: 'a', targt: 'b' })).toEqual({
      unknown: ['targt'],
      retired: ['execute'],
    });
  });
});
