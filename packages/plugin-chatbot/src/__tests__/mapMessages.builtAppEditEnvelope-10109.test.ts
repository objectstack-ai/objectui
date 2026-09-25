/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * objectui#10109 — `detectBuiltAppPackage` must not read an INCREMENTAL edit
 * as a whole-app build.
 *
 * `apply_edit` now lists everything it staged in `drafted[]`, and an
 * `add_object` op re-stages the `app` artifact (the nav merge). "Does
 * `drafted[]` contain an `app` entry" was an exact whole-app test only while
 * `apply_blueprint` was its sole producer. The producer declares the
 * difference on the envelope — `kind: 'edit'` on `apply_edit`, no `kind` on
 * `apply_blueprint` — and deliberately does NOT drop the `app` entry from
 * `drafted[]`, which is the ground truth of the staged set.
 *
 * The envelope shapes below are the producer's declaration as recorded on
 * objectui#10109; the producer lives outside this repository.
 */
import { describe, it, expect } from 'vitest';
import { detectBuiltAppPackage, detectDraftResult } from '../mapMessages';

/** An `apply_edit` with an `add_object` op against an app that has a nav. */
const editEnvelope = (status: 'drafted' | 'published') => ({
  status,
  kind: 'edit',
  packageId: 'app.k9',
  drafted: [
    { type: 'object', name: 'k9_invoice' },
    { type: 'app', name: 'k9_app' },
  ],
  changedArtifacts: [
    { type: 'object', name: 'k9_invoice' },
    { type: 'app', name: 'k9_app' },
  ],
});

/** The whole-app build: `apply_blueprint` carries no `kind`. */
const blueprintEnvelope = (status: 'drafted' | 'published') => ({
  status,
  packageId: 'app.k9',
  drafted: [
    { type: 'app', name: 'k9_app' },
    { type: 'object', name: 'k9_task' },
  ],
});

/** The persisted form: the envelope rides a Vercel `{ type:'text', value }` wrapper. */
const wrapped = (envelope: object) => ({ type: 'text', value: JSON.stringify(envelope) });

describe('detectBuiltAppPackage — an edit envelope is not a whole-app build (objectui#10109)', () => {
  it.each(['drafted', 'published'] as const)(
    'an apply_edit that re-staged the app artifact (%s posture) is not a built app',
    (status) => {
      expect(detectBuiltAppPackage(editEnvelope(status))).toBeUndefined();
      expect(detectBuiltAppPackage(wrapped(editEnvelope(status)))).toBeUndefined();
      expect(detectBuiltAppPackage(JSON.stringify(editEnvelope(status)))).toBeUndefined();
    },
  );

  it.each(['drafted', 'published'] as const)(
    'control: an apply_blueprint build (%s posture) is still a built app',
    (status) => {
      expect(detectBuiltAppPackage(blueprintEnvelope(status))).toBe('app.k9');
      expect(detectBuiltAppPackage(wrapped(blueprintEnvelope(status)))).toBe('app.k9');
      expect(detectBuiltAppPackage(JSON.stringify(blueprintEnvelope(status)))).toBe('app.k9');
    },
  );

  it('the edit keeps its draft card: detectDraftResult still lifts every staged item and the package', () => {
    expect(detectDraftResult(editEnvelope('drafted'))).toEqual({
      items: [
        { type: 'object', name: 'k9_invoice' },
        { type: 'app', name: 'k9_app' },
      ],
      packageId: 'app.k9',
    });
  });
});
