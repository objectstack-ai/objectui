// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11910 — which dashboards the Interfaces pillar's leaf autosave HOLDS
 * instead of sending.
 *
 * The card: *Add widget* → *Metric* autosaved `{ id, type, title }`, the draft
 * door answered 422 on `widgets.0.dataset` and `widgets.0.values`, and a red
 * "Changes not saved" showed before the author could bind a dataset. A widget
 * cannot be born valid without a dataset the author has not chosen, so the
 * pillar now holds such a dashboard unsent and names what the widget needs,
 * as objectui#11786 does for the Data and Automations pillars.
 *
 * The predicate asks the spec's own widget schema. Every "held" case below is
 * paired with the spec's `DashboardSchema` verdict on the same dashboard (it
 * refuses it, naming exactly the absent inputs), and every "not held" control
 * with a dashboard that judge accepts or refuses for something the author
 * wrote: the hold is never stricter than the contract, and never hides a
 * finished but wrong widget. The pillar that acts on it is pinned in
 * `InterfacesPillar.heldWidget-11910.test.tsx`.
 */

import { describe, expect, it } from 'vitest';
import { DashboardSchema } from '@objectstack/spec/ui';
import { dashboardHeldEdit, widgetMissingInputs } from './metadataError';
import { t, tFormat } from '../metadata-admin/i18n';
import { WIDGET_TYPE_META } from '../metadata-admin/previews/widget-types';

/** The issue paths the spec's dashboard parse refuses `dashboard` at, as the door reports them. */
function dashboardRefusals(dashboard: Record<string, unknown>): string[] {
  const result = DashboardSchema.safeParse(dashboard);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

const BOUND = { id: 'pipeline', type: 'metric', title: 'Pipeline', dataset: 'sales_ds', values: ['revenue'] };

const dash = (...widgets: Array<Record<string, unknown>>) => ({ name: 'sales_dash', label: 'Sales', widgets });

/** A widget as `DashboardPreview`'s *Add widget* builds it for `type`. */
function added(type: string, id = 'widget_1'): Record<string, unknown> {
  const meta = WIDGET_TYPE_META[type];
  return { id, type, title: `New ${meta.label.toLowerCase()}`, ...(meta.defaults ?? {}) };
}

const clause = (input: string, widget: string, locale = 'en') =>
  tFormat('engine.studio.held.widgetNeedsInput', locale, { input: t(input, locale), widget });

describe('the Interfaces pillar holds a widget the spec refuses only for an absent binding (objectui#11910)', () => {
  it('every type the picker offers: a new widget is held for its dataset, as the door refuses it', () => {
    for (const type of Object.keys(WIDGET_TYPE_META)) {
      const body = dash(BOUND, added(type));
      expect(dashboardRefusals(body), type).toEqual(['widgets.1.dataset', 'widgets.1.values']);
      expect(widgetMissingInputs(added(type)), type).toEqual(['dataset', 'values']);
      expect(dashboardHeldEdit(body, 'en'), type).toEqual({
        clause: clause('engine.inspector.widget.dataset', `New ${WIDGET_TYPE_META[type].label.toLowerCase()}`),
        target: { kind: 'widget', id: 'widget_1' },
      });
    }
  });

  it('a dataset bound, no measure yet: held for its measures', () => {
    const body = dash({ ...added('metric'), dataset: 'sales_ds' });
    expect(dashboardRefusals(body)).toEqual(['widgets.0.values']);
    expect(dashboardHeldEdit(body, 'en')).toEqual({
      clause: clause('engine.inspector.widget.values', 'New metric (kpi)'),
      target: { kind: 'widget', id: 'widget_1' },
    });
  });

  it('a dataset and a measure bound: not held, and the spec accepts it', () => {
    const body = dash({ ...added('metric'), dataset: 'sales_ds', values: ['revenue'] });
    expect(dashboardRefusals(body)).toEqual([]);
    expect(dashboardHeldEdit(body, 'en')).toBeNull();
  });

  it('the first unfinished widget in the dashboard is the one named', () => {
    const body = dash(BOUND, { ...added('bar', 'widget_2'), dataset: 'sales_ds' }, added('pie', 'widget_3'));
    expect(dashboardHeldEdit(body, 'en')?.target).toEqual({ kind: 'widget', id: 'widget_2' });
  });

  it('the title is read in the designer locale, and a widget with none is named by its id', () => {
    const mapTitled = { ...added('metric'), title: { en: 'Revenue', 'zh-CN': '收入' } };
    expect(dashboardHeldEdit(dash(mapTitled), 'zh-CN')?.clause).toBe(
      clause('engine.inspector.widget.dataset', '收入', 'zh-CN'),
    );
    const untitled = added('metric');
    delete untitled.title;
    expect(dashboardHeldEdit(dash(untitled), 'en')?.clause).toBe(clause('engine.inspector.widget.dataset', 'widget_1'));
  });

  // CONTROLS — finished but wrong, or not the inspector's to finish: sent, and
  // the refusal shows.
  it('a finished widget the spec refuses (two measures on a metric) is not held', () => {
    const body = dash({ ...added('metric'), dataset: 'sales_ds', values: ['revenue', 'deal_count'] });
    expect(dashboardRefusals(body)).toEqual(['widgets.0.values']);
    expect(dashboardHeldEdit(body, 'en')).toBeNull();
  });

  it('a dataset the author wrote wrong is not held, though the measures are still absent', () => {
    const body = dash({ ...added('bar'), dataset: 'Sales Pipeline' });
    expect(dashboardRefusals(body)).toContain('widgets.0.dataset');
    expect(widgetMissingInputs(body.widgets[0])).toEqual([]);
    expect(dashboardHeldEdit(body, 'en')).toBeNull();
  });

  it('an empty measure list is a value, not an absence: not held, and its refusal shows', () => {
    const body = dash({ ...added('metric'), dataset: 'sales_ds', values: [] });
    expect(dashboardRefusals(body)).toEqual(['widgets.0.values']);
    expect(dashboardHeldEdit(body, 'en')).toBeNull();
  });

  it('a type outside the spec\'s, or a missing id, is not the inspector\'s to finish: not held', () => {
    const offType = dash({ id: 'widget_1', type: 'metric-card', title: 'Total' });
    expect(dashboardRefusals(offType)).toContain('widgets.0.type');
    expect(dashboardHeldEdit(offType, 'en')).toBeNull();

    const noId = dash({ type: 'metric', title: 'Total' });
    expect(dashboardRefusals(noId)).toContain('widgets.0.id');
    expect(dashboardHeldEdit(noId, 'en')).toBeNull();
  });

  it('a dashboard with every widget bound, or none, is not held', () => {
    expect(dashboardHeldEdit(dash(BOUND), 'en')).toBeNull();
    expect(dashboardHeldEdit(dash(), 'en')).toBeNull();
    expect(dashboardHeldEdit({ name: 'sales_dash', label: 'Sales' }, 'en')).toBeNull();
  });
});
