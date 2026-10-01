// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.
//
// Turn a publish response's per-draft failures into a FIELD-ANCHORED message.
// A publish carries per-draft failures in `data.failed[]`, each with its own
// spec-validation `issues`. This formatter heads each failed draft and lists
// its issues in the one issue-line grammar.
//
// The single-error reader (`formatMetadataError`) and that line grammar
// (`formatMetadataIssue`) moved to `@object-ui/data-objectstack` beside the
// `MetadataError.issues` they read (objectui#11302), so `plugin-designer`'s
// `MetadataFieldsPage` — which cannot import from app-shell — renders a refused
// save through the same reader. Callers import them from there directly.

import { formatMetadataIssue, type MetadataValidationIssue } from '@object-ui/data-objectstack';

/** A single failed draft from a publish response's `data.failed[]`. */
export interface PublishFailure {
  type: string;
  name: string;
  error: string;
  /** Machine code — `batch_aborted` marks a draft rolled back with the batch (ADR-0067 D2). */
  code?: string;
  issues?: MetadataValidationIssue[];
}

/**
 * framework 15.1+ (ADR-0067 D2): package publishes are ALL-OR-NOTHING. A
 * failed batch reports every draft in `failed[]` — the causal item with its
 * real error, the rest with this code — and `publishedCount: 0`.
 */
export const BATCH_ABORTED_CODE = 'batch_aborted';

/**
 * Format the `failed[]` from a publish response (the server returns 200 with
 * the drafts that didn't go live).
 *
 * Two server generations produce two shapes (both handled):
 * - **15.1+ all-or-nothing** (ADR-0067 D2): the batch rolled back atomically —
 *   render ONE rolled-back banner anchored on the causal item(s), not N
 *   parallel errors (`batch_aborted` entries are consequences, not causes).
 * - **pre-15.1 partial publish**: each failed draft gets a heading and, when
 *   the failure was a validation error, its field-anchored issues indented
 *   below.
 */
export function formatPublishFailures(failed: PublishFailure[]): string {
  const line = (f: PublishFailure): string => {
    const head = `${f.type}/${f.name}: ${f.error}`;
    const issues = Array.isArray(f.issues) ? f.issues : [];
    return [head, ...issues.map((i) => `  ${formatMetadataIssue(i)}`)].join('\n');
  };
  const aborted = failed.filter((f) => f.code === BATCH_ABORTED_CODE);
  if (aborted.length > 0) {
    const causal = failed.filter((f) => f.code !== BATCH_ABORTED_CODE);
    return [
      'Nothing was published — the batch rolled back (all-or-nothing).',
      ...(causal.length > 0 ? causal.map(line) : aborted.slice(0, 1).map(line)),
      `(${aborted.length} other draft${aborted.length === 1 ? '' : 's'} aborted with it — fix the cause and publish again.)`,
    ].join('\n');
  }
  return failed.map(line).join('\n');
}
