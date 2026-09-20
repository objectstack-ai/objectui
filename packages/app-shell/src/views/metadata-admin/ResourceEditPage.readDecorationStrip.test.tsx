// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Pins that the framework's READ DECORATIONS never reach the client edit gate
 * through the pending-draft merge (objectui#7603).
 *
 * ## The defect this file exists to keep fixed
 *
 * `client.getDraft()` serves a DECORATED body: the strict draft branch returns
 * `item: decorateMetadataItem(type, …)`, which attaches `_diagnostics` whenever
 * the type has a registered Zod schema, and `_draft` on the preview-draft
 * branch. The spec names both a READ-TIME decoration and says a served body
 * "is therefore NOT a valid input to the schema that produced it until these
 * are removed" — `METADATA_READ_DECORATIONS` in the spec kernel.
 *
 * `ResourceEditPage` merges that body over the layered baseline
 * (`{ ...baseline, ...draftReal }`) and hands the result to
 * `validateMetadataDraft`. The baseline half is clean — `getMetaItemLayered`
 * serves RAW layers — so the decoration arrives ONLY when the item has a
 * pending draft, which is why this stayed invisible: a no-draft case passes
 * today and cannot catch it. Every wired metadata type whose schema is
 * `.strict()` then reported a body THE SERVER ACCEPTS as `unrecognized_keys`,
 * putting a false "this item is invalid" banner plus inline field errors on an
 * author who is mid-edit.
 *
 * ## Why the fixture must carry a pending draft
 *
 * ⚠️ Drop the `getDraft` item from these cases and both of them still pass,
 * while the defect is fully present. The pending draft IS the trigger.
 *
 * ## The two directions, and why the second one is not optional
 *
 * A strip is only correct if it removes the framework's own keys and NOTHING
 * else. `unrecognizedGate` below feeds the same pending-draft path a body that
 * carries the two decorations AND one genuinely undeclared key, and requires
 * the gate to still refuse — naming the real key and neither decoration. That
 * case is also this file's CONTROL: it proves the gate actually runs on the
 * merged draft in this harness, so the first case's "no issues" is a measured
 * verdict rather than a validator that never fired.
 *
 * ⛔ The cure is never to loosen a schema. The ADR-0010 envelope keys
 * (`_lock`, `_provenance`, …) are allowlisted by the closed schemas ON PURPOSE
 * so provenance survives a re-parse; the decorations are not, and a gate that
 * tolerated them would destroy that distinction (AGENTS.md #0.1).
 *
 * ## Where the strip lives
 *
 * In `extractDraftBody` — the one function that turns a served draft envelope
 * into a body, and the chokepoint all THREE merge sites go through (the load
 * effect, the post-save refresh and the post-publish refresh). It reuses the
 * spec's exported `stripReadDecorations`, the same helper
 * `MetadataService.saveFields` already reaches for. ⛔ Never a second
 * hand-maintained `['_diagnostics', '_draft']` in objectui: a local copy goes
 * stale the next time the framework adds a decoration, and a decoration this
 * code does not know to remove is precisely the defect above.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** A key the bundled spec does not declare — a GENUINE author-side defect. */
const UNDECLARED_KEY = 'zzUndeclaredKey';

/** Present only in the pending draft, so we can prove the merge ran. */
const DRAFT_ONLY_LABEL = 'Home (draft in flight)';

/** The published body, exactly as the RAW layered read serves it: clean. */
const PUBLISHED_PAGE = {
  name: 'home',
  label: 'Home',
  type: 'home',
  template: 'default',
  regions: [{ name: 'main', components: [{ type: 'text', id: 'b1' }] }],
};

/**
 * The same, for `sharing_rule` — the type objectui#7612 switched the edit door
 * ON for, and the reason this file is parameterised by type at all.
 *
 * That card's release condition was "re-run the live read-path probe against a
 * decoration-stripped draft and confirm the false refusal is gone". This is
 * that probe, standing where it can be re-run: the strip is a property of the
 * assembly and not of any one type, but `sharing_rule` is the type whose gate
 * was held shut BECAUSE of the decoration, so it is the one whose verdict has
 * to be measured rather than argued from the `page` case above.
 */
const PUBLISHED_RULE = {
  name: 'west_accounts',
  label: 'West accounts',
  object: 'account',
  active: true,
  accessLevel: 'read',
  sharedWith: { type: 'position', value: 'sales_west' },
  type: 'criteria',
  condition: 'region == "west"',
};

/** Served body per metadata type, keyed the way the client is asked for it. */
const PUBLISHED: Record<string, Record<string, unknown>> = {
  page: PUBLISHED_PAGE,
  sharing_rule: PUBLISHED_RULE,
};

/**
 * The framework's read-time decorations, spelled out because this fixture is
 * standing in for a real served body. ⛔ Not imported from the spec: a fixture
 * that derives its own input from the list under test would pass even if that
 * list were emptied. The PRODUCTION strip is the thing that must read the
 * spec, and it does.
 */
const READ_DECORATIONS = {
  _diagnostics: { valid: true, errors: [], warnings: [] },
  _draft: true,
};

/** A served draft envelope: `{ type, name, item }` with the item decorated. */
const draftEnvelope = (type: string, extra: Record<string, unknown> = {}) => ({
  type,
  name: PUBLISHED[type]!.name,
  item: { ...PUBLISHED[type]!, label: DRAFT_ONLY_LABEL, ...READ_DECORATIONS, ...extra },
});

/**
 * Records what the REAL gate was asked to judge and what it answered.
 *
 * The assertions read this rather than the banner on purpose: the banner is a
 * rendering of the verdict, while this is the verdict — the same measurement
 * the card reports (`body + _diagnostics -> REJECT unrecognized_keys`).
 */
const gate = vi.hoisted(() => ({
  calls: [] as Array<{ draft: Record<string, unknown>; ok: boolean; issues: Array<{ path: string; message: string }> }>,
}));

const mockClient = vi.hoisted(() => ({
  list: vi.fn(async () => []),
  listDrafts: vi.fn(async () => []),
  // The layered read serves its three layers RAW — no decoration on this half,
  // which is why only a PENDING DRAFT can carry one into the merge.
  layered: vi.fn(async (type: string) => ({
    effective: PUBLISHED[type]!,
    code: PUBLISHED[type]!,
    editable: true,
  })),
  getDraft: vi.fn(async (type: string) => draftEnvelope(type)),
  get: vi.fn(async () => null),
  saveDraft: vi.fn(async () => ({})),
}));

vi.mock('./useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./useMetadata')>();
  return {
    ...mod,
    useMetadataClient: () => mockClient,
    useMetadataTypes: () => ({
      entries: [
        {
          type: 'page',
          name: 'page',
          label: 'Page',
          allowOrgOverride: true,
          // The most lenient live server there can be. It is handed to the
          // cross-repo spec-skew cure, which only drops TOP-LEVEL absent
          // required fields — it structurally cannot suppress an
          // `unrecognized_keys` issue, whose path is empty. So no server hint
          // can rescue a decorated body; only the strip can.
          schema: { required: [] },
        },
        {
          type: 'sharing_rule',
          name: 'sharing_rule',
          label: 'Sharing Rule',
          allowOrgOverride: true,
          // Same reasoning, and load-bearing twice over here: this is the type
          // whose edit gate the root-cure was measured unable to rescue.
          schema: { required: [] },
        },
      ],
    }),
  };
});

/**
 * The gate itself is REAL — this wrapper only records. Stubbing the verdict
 * would leave the assertions measuring the stub.
 */
vi.mock('./clientValidation.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./clientValidation')>();
  return {
    ...mod,
    validateMetadataDraft: async (
      ...args: Parameters<typeof mod.validateMetadataDraft>
    ): Promise<Awaited<ReturnType<typeof mod.validateMetadataDraft>>> => {
      const res = await mod.validateMetadataDraft(...args);
      gate.calls.push({
        draft: (args[1] ?? {}) as Record<string, unknown>,
        ok: res.ok,
        issues: res.issues,
      });
      return res;
    },
  };
});

import { MetadataResourceEditPage } from './ResourceEditPage';
import { registerBuiltinInspectors } from './inspectors';

registerBuiltinInspectors();

beforeEach(() => {
  gate.calls.length = 0;
  mockClient.getDraft.mockImplementation(async (type: string) => draftEnvelope(type));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openEditor(type: string) {
  const name = PUBLISHED[type]!.name as string;
  render(
    <MemoryRouter initialEntries={[`/metadata/${type}/${name}`]}>
      <MetadataResourceEditPage type={type} name={name} />
    </MemoryRouter>,
  );
}

/**
 * The LAST verdict taken on the merged draft — the one the pending draft won.
 *
 * Index arithmetic rather than `Array.prototype.findLast`: this package's
 * `type-check` compiles against a lib older than es2023, where that method does
 * not exist on the type. It runs fine under vitest, so the failure would have
 * been `tsc`-only — green tests, red CI.
 */
function lastMergedVerdict() {
  const merged = gate.calls.filter((c) => c.draft.label === DRAFT_ONLY_LABEL);
  return merged[merged.length - 1];
}

/**
 * Wait for the gate to judge the MERGED draft. Anchoring on `DRAFT_ONLY_LABEL`
 * is what makes every later assertion be about the pending-draft path: a
 * verdict taken on the baseline-only draft would be clean for a reason that has
 * nothing to do with this fix.
 */
async function awaitMergedVerdict() {
  await waitFor(
    () => {
      expect(lastMergedVerdict(), 'the gate never judged the merged pending draft').toBeDefined();
    },
    { timeout: 4000 },
  );
  return lastMergedVerdict()!;
}

const keysNamedIn = (issues: Array<{ message: string }>) => issues.map((i) => i.message).join(' | ');

describe('MetadataResourceEditPage — read decorations never reach the edit gate (#7603)', () => {
  it('accepts a served body whose pending draft carries `_diagnostics` and `_draft`', async () => {
    openEditor('page');
    const verdict = await awaitMergedVerdict();

    // The decorations were on the wire…
    expect(await mockClient.getDraft.mock.results[0]!.value).toMatchObject({
      item: { _diagnostics: expect.anything(), _draft: true },
    });
    // …and did NOT survive into what the gate judged.
    expect(Object.keys(verdict.draft)).not.toContain('_diagnostics');
    expect(Object.keys(verdict.draft)).not.toContain('_draft');

    // The verdict itself: the body the server accepts, the client accepts.
    expect(verdict.issues, keysNamedIn(verdict.issues)).toEqual([]);
    expect(verdict.ok).toBe(true);

    // …and the author sees no "this item is invalid" banner.
    expect(screen.queryByTestId('metadata-validation-banner')).not.toBeInTheDocument();

    // The author's own content survived the strip untouched.
    expect(verdict.draft.label).toBe(DRAFT_ONLY_LABEL);
    expect(verdict.draft.regions).toEqual(PUBLISHED_PAGE.regions);
  });

  it('still refuses a genuinely undeclared key riding the same decorated draft', async () => {
    mockClient.getDraft.mockImplementation(async (type: string) =>
      draftEnvelope(type, { [UNDECLARED_KEY]: 1 }),
    );
    openEditor('page');
    const verdict = await awaitMergedVerdict();

    // The strip is not a "drop whatever the schema refuses" pass: an author's
    // real defect still fails, loudly, and by name.
    expect(verdict.ok).toBe(false);
    expect(keysNamedIn(verdict.issues)).toContain(UNDECLARED_KEY);

    // …and neither decoration is named alongside it — the strip took exactly
    // the framework's own keys and left the author's.
    expect(keysNamedIn(verdict.issues)).not.toContain('_diagnostics');
    expect(keysNamedIn(verdict.issues)).not.toContain('_draft');

    // The banner is the CONTROL for the previous case: it fires here, in this
    // same harness, on this same pending-draft path.
    const banner = await screen.findByTestId('metadata-validation-banner', undefined, { timeout: 4000 });
    expect(banner).toHaveTextContent(UNDECLARED_KEY);
  });
});

/**
 * objectui#7612 — the same probe, on the type whose edit door was held shut
 * BY the decoration, now that the door is open.
 *
 * ## Why these cases are not a duplicate of the two above
 *
 * The `page` cases prove the assembly strips. They cannot prove this card's
 * claim, because with `sharing_rule` on the author-shape-only list the gate did
 * not run for it at all: every assertion about its verdict was vacuous, and a
 * body carrying `_diagnostics` "passed" for the reason that nothing looked.
 * These cases measure the verdict itself, on the door the card opened.
 *
 * ## The refusal these pin the ABSENCE of
 *
 * `SharingRuleSchema` is `.strict()` and still refuses both read decorations at
 * the ROOT — that has NOT changed and is not what made the switch safe (the
 * schema-side reading lives in `clientValidation.optOuts.test.ts`, in the case
 * naming a served body). What changed is upstream of the gate: the decorations
 * no longer survive the assembly, so the strict schema never sees one. If the
 * strip regresses, the first case below goes red HERE — on the real page, with
 * the real gate — rather than in production as a banner on an author who is
 * mid-edit.
 */
describe('MetadataResourceEditPage — the sharing_rule edit gate judges a stripped draft (#7612)', () => {
  it('accepts a sharing rule whose pending draft carries `_diagnostics` and `_draft`', async () => {
    openEditor('sharing_rule');
    const verdict = await awaitMergedVerdict();

    // The decorations were on the wire for THIS type…
    expect(await mockClient.getDraft.mock.results[0]!.value).toMatchObject({
      type: 'sharing_rule',
      item: { _diagnostics: expect.anything(), _draft: true },
    });
    // …and did not survive into what the gate judged.
    expect(Object.keys(verdict.draft)).not.toContain('_diagnostics');
    expect(Object.keys(verdict.draft)).not.toContain('_draft');

    // The verdict the card is about: the body the server accepts, the client
    // now also accepts — having actually looked at it.
    expect(verdict.issues, keysNamedIn(verdict.issues)).toEqual([]);
    expect(verdict.ok).toBe(true);
    expect(screen.queryByTestId('metadata-validation-banner')).not.toBeInTheDocument();

    // The author's own edit survived the strip.
    expect(verdict.draft.label).toBe(DRAFT_ONLY_LABEL);
    expect(verdict.draft.condition).toBe(PUBLISHED_RULE.condition);
  });

  it('refuses an invalid sharing rule on the edit door — the gate this card added', async () => {
    // An `accessLevel` outside the declared enum: a VALUE the schema refuses,
    // chosen over an unknown key on purpose. An unknown key would also be
    // caught by the create door, so it could not tell "the edit door gained a
    // gate" from "some door somewhere is strict"; this is the defense-in-depth
    // the card bought, measured where it was bought.
    mockClient.getDraft.mockImplementation(async (type: string) =>
      draftEnvelope(type, { accessLevel: 'superuser' }),
    );
    openEditor('sharing_rule');
    const verdict = await awaitMergedVerdict();

    expect(verdict.ok).toBe(false);
    expect(verdict.issues.map((i) => i.path)).toContain('accessLevel');

    // …and neither decoration is named alongside it: the refusal is about the
    // author's value, never about the framework's own keys.
    expect(keysNamedIn(verdict.issues)).not.toContain('_diagnostics');
    expect(keysNamedIn(verdict.issues)).not.toContain('_draft');

    // The CONTROL for the case above, in this same harness on this same type:
    // the banner fires, so the clean case's silence is a measured verdict and
    // not a gate that never ran.
    const banner = await screen.findByTestId('metadata-validation-banner', undefined, { timeout: 4000 });
    expect(banner).toBeInTheDocument();
  });
});
