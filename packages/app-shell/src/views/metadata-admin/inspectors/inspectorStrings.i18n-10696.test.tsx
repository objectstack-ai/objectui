// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#10696 — inspector words that were English literals, although the
 * designer catalogue (`../i18n`) already carried the same English under a key
 * with a zh row, now read that key.
 *
 * The card named one site: the dashboard widget inspector's filter-binding
 * field combo passed `Search fields…` as its search placeholder, while its
 * sibling `DatasetDefaultInspector` read `engine.form.searchFields` for the same
 * combo. A census of the inspectors' user-visible props found the others
 * pinned below. No key was added: every site reads a row that was already
 * there, so the objectui#4662 `engine.*` carve-out does not move.
 *
 * ── How each site is read ────────────────────────────────────────────────────
 * Every case reads the RENDERED attribute or text — the open combo's search
 * box, a button's `aria-label`, an input's `placeholder`, a select trigger's
 * text — never a label function in isolation. Each zh expectation is read back
 * from the catalogue behind a guard (`zhRow`) proving it is a real zh row: not
 * the key echoed back, and not the English one. So no case can pass on a
 * missing row, and none restates a translation.
 *
 * ── Lit controls ─────────────────────────────────────────────────────────────
 * Beside each site, a control that already rendered its zh row before this
 * change, read by the same probe on the same mount (or, for the card's own
 * control, `DatasetDefaultInspector`). A site that stays English beside a lit
 * control is the defect; both staying English would be a broken harness.
 *
 * ── en ───────────────────────────────────────────────────────────────────────
 * The en cases read the same key's en row: the rows the sites now read carry
 * the English the literals did, which is why en renders unchanged.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react';
import { I18nProvider } from '@object-ui/i18n';

// Every roster in these inspectors comes through the shared metadata client.
// STABLE identity, like the real memoized client: a fresh object per render
// would re-run the fetching effects forever. Nothing here needs a roster to
// answer — the pinned words render with an empty one.
const state = vi.hoisted(() => ({
  metadataClient: {
    get: async () => undefined,
    list: async (): Promise<unknown[]> => [],
    listDrafts: async (): Promise<unknown[]> => [],
  },
}));
vi.mock('../useMetadata', () => ({
  useMetadataClient: () => state.metadataClient,
}));

import { t, tFormat } from '../i18n';
import { DashboardWidgetInspector } from './DashboardWidgetInspector';
import { DatasetDefaultInspector } from './DatasetDefaultInspector';
import { ViewVariantInspector } from './ViewVariantInspector';
import { ObjectFieldInspector } from './ObjectFieldInspector';
import { FlowEdgeInspector } from './FlowEdgeInspector';

afterEach(cleanup);

type Lang = 'en' | 'zh';
const LOCALE = { en: 'en-US', zh: 'zh-CN' } as const;

/** The console mounts every inspector under the i18n provider in its language. */
function inLang(lang: Lang, ui: React.ReactElement) {
  return render(
    <I18nProvider config={{ defaultLanguage: lang, detectBrowserLanguage: false }}>{ui}</I18nProvider>,
  );
}

/** Let mount-time effects and resolved fetches settle. */
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** A zh catalogue row that is really there: not the echoed key, not the en row. */
function zhRow(key: string): string {
  const zh = t(key, 'zh-CN');
  expect(zh, `${key}: a missing zh row echoes the key back`).not.toBe(key);
  expect(zh, `${key}: the zh row must not be the English one`).not.toBe(t(key, 'en-US'));
  return zh;
}

/** The combo trigger a `<Label htmlFor>` names. */
function comboTrigger(labelText: string): HTMLElement {
  const label = Array.from(document.body.querySelectorAll('label')).find((l) => l.textContent === labelText);
  expect(label, `the combo label ${labelText}`).toBeTruthy();
  const trigger = document.getElementById(label!.htmlFor);
  expect(trigger?.getAttribute('role'), 'the label names a combobox').toBe('combobox');
  return trigger as HTMLElement;
}

/** Open a combo and read its search box's placeholder. */
async function searchBoxOf(trigger: HTMLElement): Promise<string | null> {
  fireEvent.click(trigger);
  await flush();
  const input = document.body.querySelector<HTMLInputElement>('[cmdk-input]');
  expect(input, 'the combo search box').toBeTruthy();
  return input!.getAttribute('placeholder');
}

// ─── DashboardWidgetInspector — the card's site ─────────────────────────────

function mountWidget(lang: Lang) {
  inLang(lang, (
    <DashboardWidgetInspector
      type="dashboard"
      name="sales"
      draft={{
        globalFilters: [{ name: 'region', field: 'region', label: 'Region', type: 'select', options: [{ value: 'EMEA', label: 'EMEA' }] }],
        widgets: [{ id: 'w1', type: 'bar', title: 'Revenue' }],
      }}
      selection={{ kind: 'widget', id: 'w1' }}
      onPatch={() => {}}
      onClearSelection={() => {}}
      onSelectionChange={() => {}}
      readOnly={false}
      locale={LOCALE[lang]}
    />
  ));
}

const bindingCombo = () => within(screen.getByTestId('widget-filter-binding-region')).getByRole('combobox');

describe('DashboardWidgetInspector — the filter-binding field combo’s search box (objectui#10696)', () => {
  it('zh: reads engine.form.searchFields', async () => {
    mountWidget('zh');
    await flush();
    expect(await searchBoxOf(bindingCombo())).toBe(zhRow('engine.form.searchFields'));
  });

  it('zh, lit control: the same inspector’s dataset combo reads its own row', async () => {
    mountWidget('zh');
    await flush();
    expect(await searchBoxOf(document.getElementById('widget-dataset')!)).toBe(
      zhRow('engine.inspector.widget.datasetPlaceholder'),
    );
  });

  it('en: reads the en row of the same key', async () => {
    mountWidget('en');
    await flush();
    expect(await searchBoxOf(bindingCombo())).toBe(t('engine.form.searchFields', 'en-US'));
  });
});

// ─── ViewVariantInspector — the object picker ───────────────────────────────

function mountView(lang: Lang) {
  inLang(lang, (
    <ViewVariantInspector
      type="view"
      name="invoices"
      draft={{ name: 'invoices', label: 'Invoices', list: { type: 'grid', object: 'invoices' } }}
      onPatch={() => {}}
      onSelectionChange={() => {}}
      onClearSelection={() => {}}
      readOnly={false}
      locale={LOCALE[lang]}
      variantKey="list"
      familyKey="list"
      isHome={false}
      objectFieldsOverride={[]}
    />
  ));
}

describe('ViewVariantInspector — the object picker’s search box (objectui#10696)', () => {
  it('zh: reads engine.inspector.dataset.searchObjects', async () => {
    mountView('zh');
    await flush();
    const trigger = comboTrigger(t('engine.inspector.view.object', 'zh-CN'));
    expect(await searchBoxOf(trigger)).toBe(zhRow('engine.inspector.dataset.searchObjects'));
  });

  it('en: reads the en row of the same key', async () => {
    mountView('en');
    await flush();
    const trigger = comboTrigger(t('engine.inspector.view.object', 'en-US'));
    expect(await searchBoxOf(trigger)).toBe(t('engine.inspector.dataset.searchObjects', 'en-US'));
  });
});

// ─── The card's lit control ─────────────────────────────────────────────────

describe('lit control: DatasetDefaultInspector already read both search rows (objectui#10696)', () => {
  function mountDataset() {
    inLang('zh', (
      <DatasetDefaultInspector
        type="dataset"
        name="sales"
        locale="zh-CN"
        draft={{
          name: 'sales',
          label: 'Sales',
          object: 'opportunity',
          dimensions: [{ name: 'region', field: 'region', type: 'string' }],
        }}
        onPatch={() => {}}
        readOnly={false}
      />
    ));
  }

  it('zh: its dimension field combo reads engine.form.searchFields', async () => {
    mountDataset();
    await flush();
    const trigger = comboTrigger(t('engine.inspector.dataset.field', 'zh-CN'));
    expect(await searchBoxOf(trigger)).toBe(zhRow('engine.form.searchFields'));
  });

  it('zh: its base-object combo reads engine.inspector.dataset.searchObjects', async () => {
    mountDataset();
    await flush();
    const trigger = comboTrigger(t('engine.inspector.dataset.baseObject', 'zh-CN'));
    expect(await searchBoxOf(trigger)).toBe(zhRow('engine.inspector.dataset.searchObjects'));
  });
});

// ─── ObjectFieldInspector — lookup and roll-up filter rows ──────────────────

const FIELDS = {
  owner: {
    type: 'lookup',
    label: 'Owner',
    reference: 'user',
    lookupFilters: [{ field: 'status', operator: 'eq', value: '' }],
    dependsOn: ['region'],
  },
  region: { type: 'text', label: 'Region' },
  total: {
    type: 'summary',
    label: 'Total',
    summaryOperations: { object: 'opportunity', function: 'count', filter: { stage: '' } },
  },
};

function mountField(lang: Lang, id: keyof typeof FIELDS) {
  inLang(lang, (
    <ObjectFieldInspector
      type="object"
      name="account"
      draft={{ name: 'account', fields: FIELDS }}
      selection={{ kind: 'field', id }}
      onPatch={() => {}}
      onClearSelection={() => {}}
      onSelectionChange={() => {}}
      readOnly={false}
      locale={LOCALE[lang]}
    />
  ));
}

/** The filter row's value input, by its (translated) label. */
const filterValueInput = (lang: Lang) =>
  screen.getByLabelText(t('designer.field.lookup.filterValue', LOCALE[lang])) as HTMLInputElement;

/** The `dependsOn` chip's remove button — the only `×` button in the panel. */
function dependsOnRemove(): HTMLElement {
  const buttons = screen.getAllByRole('button').filter((b) => b.textContent === '×');
  expect(buttons, 'exactly one dependsOn chip remove button').toHaveLength(1);
  return buttons[0];
}

describe('ObjectFieldInspector — the lookup config’s filter value and dependsOn chip (objectui#10696)', () => {
  it('zh: the dependsOn chip’s remove button is named by engine.form.removeNamed', async () => {
    mountField('zh', 'owner');
    await flush();
    zhRow('engine.form.removeNamed');
    expect(dependsOnRemove().getAttribute('aria-label')).toBe(
      tFormat('engine.form.removeNamed', 'zh-CN', { name: 'region' }),
    );
  });

  it('zh: the filter value input’s placeholder reads engine.inspector.condition.valuePlaceholder', async () => {
    mountField('zh', 'owner');
    await flush();
    expect(filterValueInput('zh').getAttribute('placeholder')).toBe(
      zhRow('engine.inspector.condition.valuePlaceholder'),
    );
  });

  it('zh, lit control: the same filter row’s remove button already read its row', async () => {
    mountField('zh', 'owner');
    await flush();
    expect(screen.getAllByRole('button', { name: zhRow('designer.field.lookup.removeFilter') })).toHaveLength(1);
  });

  it('en: both read the en rows of the same keys', async () => {
    mountField('en', 'owner');
    await flush();
    expect(dependsOnRemove().getAttribute('aria-label')).toBe(
      tFormat('engine.form.removeNamed', 'en-US', { name: 'region' }),
    );
    expect(filterValueInput('en').getAttribute('placeholder')).toBe(
      t('engine.inspector.condition.valuePlaceholder', 'en-US'),
    );
  });
});

describe('ObjectFieldInspector — the roll-up summary’s filter value (objectui#10696)', () => {
  it('zh: the filter value input’s placeholder reads engine.inspector.condition.valuePlaceholder', async () => {
    mountField('zh', 'total');
    await flush();
    expect(filterValueInput('zh').getAttribute('placeholder')).toBe(
      zhRow('engine.inspector.condition.valuePlaceholder'),
    );
  });

  it('en: reads the en row of the same key', async () => {
    mountField('en', 'total');
    await flush();
    expect(filterValueInput('en').getAttribute('placeholder')).toBe(
      t('engine.inspector.condition.valuePlaceholder', 'en-US'),
    );
  });
});

// ─── FlowEdgeInspector — the decision-branch picker ─────────────────────────

const EXPR = 'record.amount > 100';

function mountEdge(lang: Lang, edge: Record<string, unknown>): HTMLElement {
  inLang(lang, (
    <FlowEdgeInspector
      type="flow"
      name="route"
      draft={{
        nodes: [
          { id: 'd1', type: 'decision', label: 'Route', config: { conditions: [{ expression: EXPR }, { label: 'Otherwise', expression: 'true' }] } },
          { id: 'n2', type: 'end', label: 'Done' },
        ],
        edges: [{ id: 'e1', source: 'd1', target: 'n2', ...edge }],
      }}
      selection={{ kind: 'edge', id: 'e1' }}
      onPatch={() => {}}
      onClearSelection={() => {}}
      onSelectionChange={() => {}}
      readOnly={false}
      locale={LOCALE[lang]}
    />
  ));
  // Found by its accessible name, which is the picker's own label read in
  // `lang` — the lit control on this mount, already translated before.
  return screen.getByRole('combobox', { name: t('engine.inspector.flowEdge.branch', LOCALE[lang]) });
}

describe('FlowEdgeInspector — the decision-branch picker’s option labels (objectui#10696)', () => {
  it('zh, lit control: the picker is named by its zh label', () => {
    expect(mountEdge('zh', {})).toBeTruthy();
    zhRow('engine.inspector.flowEdge.branch');
  });

  it('zh: an edge bound to no branch shows engine.inspector.flowEdge.branchCustom', () => {
    expect(mountEdge('zh', {}).textContent).toBe(zhRow('engine.inspector.flowEdge.branchCustom'));
  });

  it('zh: an unnamed branch is named by engine.flowRegion.branchN', () => {
    zhRow('engine.flowRegion.branchN');
    expect(mountEdge('zh', { condition: EXPR }).textContent).toBe(
      `${tFormat('engine.flowRegion.branchN', 'zh-CN', { n: 1 })} · ${EXPR}`,
    );
  });

  it('en: both read the en rows of the same keys', () => {
    expect(mountEdge('en', {}).textContent).toBe(t('engine.inspector.flowEdge.branchCustom', 'en-US'));
    cleanup();
    expect(mountEdge('en', { condition: EXPR }).textContent).toBe(
      `${tFormat('engine.flowRegion.branchN', 'en-US', { n: 1 })} · ${EXPR}`,
    );
  });
});
