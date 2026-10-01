// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

import { describe, it, expect } from 'vitest';
// `formatMetadataError` / `extractIssues` and their cases moved to
// `@object-ui/data-objectstack` (`metadata-error.test.ts`) with the reader
// itself (objectui#11302); this file keeps the publish formatter's cases.
import { formatPublishFailures } from './metadataError';

describe('formatPublishFailures', () => {
  it('heads each failed draft and indents its field-anchored issues', () => {
    const out = formatPublishFailures([
      {
        type: 'object',
        name: 'invoice',
        error: 'failed spec validation',
        issues: [{ path: 'fields.total.type', message: 'Required' }],
      },
      { type: 'flow', name: 'notify', error: 'start node missing' },
    ]);
    expect(out).toBe(
      'object/invoice: failed spec validation\n  • fields.total.type — Required\n' +
        'flow/notify: start node missing',
    );
  });

  // framework 15.1+ (ADR-0067 D2) — the batch is all-or-nothing; `failed[]`
  // carries the causal item + batch_aborted markers for the rolled-back rest.
  it('15.1+ all-or-nothing: one rolled-back banner anchored on the causal item', () => {
    const out = formatPublishFailures([
      { type: 'object', name: 'crm_lead', error: 'not published — the batch is all-or-nothing…', code: 'batch_aborted' },
      {
        type: 'object', name: 'crm_deal', error: 'failed spec validation', code: 'invalid_metadata',
        issues: [{ path: 'fields.amount.type', message: 'Required' }],
      },
      { type: 'view', name: 'lead_list', error: 'not published — …', code: 'batch_aborted' },
    ]);
    expect(out).toContain('Nothing was published — the batch rolled back');
    // causal item with its real error and field-anchored issues…
    expect(out).toContain('object/crm_deal: failed spec validation');
    expect(out).toContain('fields.amount.type — Required');
    // …aborted entries summarized, not listed as parallel errors
    expect(out).not.toContain('crm_lead: not published');
    expect(out).toContain('2 other drafts aborted with it');
  });

  it('all entries aborted (defensive): banner still renders with one sample', () => {
    const out = formatPublishFailures([
      { type: 'object', name: 'a', error: 'not published — …', code: 'batch_aborted' },
      { type: 'object', name: 'b', error: 'not published — …', code: 'batch_aborted' },
    ]);
    expect(out).toContain('Nothing was published');
    expect(out).toContain('object/a');
  });
});
