// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11858 — when Monaco's CDN loader script cannot be fetched (no
 * egress, a strict CSP), SchemaForm's `code` widget renders an editable
 * textarea that saves, the failure is reported once per page, and nothing
 * escapes as an uncaught error.
 *
 * ## The defect this file keeps fixed
 *
 * `CodeWidget` rendered `@object-ui/plugin-editor`'s `CodeEditorRenderer`, the
 * bare Monaco `<Editor>`, with no fallback. With the CDN blocked it stayed on
 * Monaco's own "Loading..." with nothing editable, so a hook body or a field's
 * `visibleWhen` could not be written at all, and each editor's own
 * `loader.init()` logged "Monaco initialization: error" and leaked an uncaught
 * rejection. The source editors already fell back through `useMonacoFallback`
 * (objectui#11800); the widget now reads that same one-per-page loader probe.
 *
 * ## The host is real
 *
 * The rows are rendered by `SchemaForm` from the installed `@objectstack/spec`
 * forms, with each type's JSON Schema derived through the same `z.toJSONSchema`
 * call `/meta/types` serves it with: `hookForm`'s `body.source` (what the hook
 * edit page renders) and `fieldForm`'s `visibleWhen` (what the field detail
 * drawer renders, scoped as the drawer scopes it). "Saves" is read as the next
 * draft the form hands its host carrying the edit, and that draft passing the
 * type's own spec schema.
 *
 * ## Nothing about Monaco is mocked
 *
 * As in `useMonacoFallback.loaderRejection-11800.test.tsx`, this drives the REAL
 * `@monaco-editor/loader` and the real plugin-editor `<Editor>`: the leak lives
 * in the loader, and a stubbed `loader.init` would hand back a promise the
 * caller CAN catch. Two pieces of browser behaviour are modelled, and only
 * these two, the same way that file models them:
 *
 *  - **The network.** The loader appends a `vs/loader.js` script and waits for
 *    its `error` event. The script is held back from the DOM and its `error`
 *    event fired by the test, after both lazy editor modules have loaded, so
 *    an editor that mounted before the loader answered would have mounted.
 *  - **Unhandled rejections.** Each Node report is replayed as a cancelable
 *    `unhandledrejection` event on `window`, and the ones left uncancelled are
 *    counted. Vitest's own listeners are put back afterwards.
 *
 * The probe's outcome is module state, so this file owns the failing page and
 * the reachable-loader control lives in `CodeWidget.expressionEnvelope-10963.test.tsx`.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { z } from 'zod';
import { FieldSchema, HookSchema, fieldForm, hookForm } from '@objectstack/spec/data';

// The modules behind the widget's two lazy boundaries, loaded at module scope
// so both `React.lazy` factories resolve at once (the repo's lazy-boundary
// rule). The first is the widget's own specifier; the second is the file
// plugin-editor's `React.lazy(() => import('./MonacoImpl'))` resolves to. With
// both loaded, an editor mounted before the loader answers WOULD mount, so
// the counts below can see it.
import '@object-ui/plugin-editor';
import '../../../../plugin-editor/src/MonacoImpl';

import { SchemaForm, DRAWER_EMBEDDED_ITEM_ID_SCOPE } from './SchemaForm';
import { CodeWidget } from './widgets';
import type { FormFieldSpec, FormViewSpec } from './form-spec';

const LOADER_SCRIPT = /\/vs\/loader\.js$/;

let uncaught: unknown[] = [];
let vitestListeners: NodeJS.UnhandledRejectionListener[] = [];
let heldLoaderScripts: HTMLScriptElement[] = [];

function replayAsBrowser(reason: unknown): void {
  const event = new Event('unhandledrejection', { cancelable: true });
  Object.defineProperty(event, 'reason', { value: reason });
  window.dispatchEvent(event);
  if (!event.defaultPrevented) uncaught.push(reason);
}

/** The console lines that speak about Monaco — other warnings on the page are not this card's. */
function monacoReports(calls: unknown[][]): string[] {
  return calls.map((args) => args.map(String).join(' ')).filter((line) => /monaco/i.test(line));
}

/** Let Node finish a microtask checkpoint and report what it left unhandled. */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  uncaught = [];
  heldLoaderScripts = [];
  vitestListeners = process.listeners('unhandledRejection');
  process.removeAllListeners('unhandledRejection');
  process.on('unhandledRejection', replayAsBrowser);

  const append = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLScriptElement && LOADER_SCRIPT.test(node.src)) {
      heldLoaderScripts.push(node);
      return node;
    }
    return append(node);
  });
});

afterEach(() => {
  cleanup();
  process.off('unhandledRejection', replayAsBrowser);
  for (const listener of vitestListeners) process.on('unhandledRejection', listener);
  vi.restoreAllMocks();
});

const TO_JSON_SCHEMA = { io: 'input', unrepresentable: 'any' } as const;
const HOOK_SCHEMA = z.toJSONSchema(HookSchema, TO_JSON_SCHEMA) as Record<string, unknown>;
const FIELD_SCHEMA = z.toJSONSchema(FieldSchema, TO_JSON_SCHEMA) as Record<string, unknown>;
const HOOK_FORM = hookForm as unknown as FormViewSpec;
const FIELD_FORM = fieldForm as unknown as FormViewSpec;

/** A row of a spec form by name, at the top level or one composite deep. */
function specRow(form: unknown, path: string[]): FormFieldSpec {
  type Row = Record<string, unknown> & { field?: string; fields?: Row[] };
  let rows: Row[] = ((form as { sections: Array<{ fields: Row[] }> }).sections ?? []).flatMap((s) => s.fields ?? []);
  let hit: Row | undefined;
  for (const name of path) {
    hit = rows.find((r) => r.field === name);
    if (!hit) throw new Error(`spec form has no row ${path.join('.')}`);
    rows = hit.fields ?? [];
  }
  return hit as unknown as FormFieldSpec;
}

const META = { rationale: 'Only invoices carry an amount', generatedBy: 'agent:invoice-form' };

const HOOK_DRAFT: Record<string, unknown> = {
  name: 'invoice_guard',
  label: 'Invoice guard',
  object: 'invoice',
  events: ['beforeInsert'],
  body: { language: 'js', source: 'return;' },
};

/** A stored field with a `visibleWhen`, authored with `meta` and parsed by the spec. */
const FIELD_DRAFT = FieldSchema.parse({
  name: 'amount',
  label: 'Amount',
  type: 'number',
  visibleWhen: { dialect: 'cel', source: "record.type == 'invoice'", meta: META },
}) as Record<string, unknown>;

/** The widget's own editing surface: a textarea named by the row's label. */
async function codeTextarea(name: RegExp): Promise<HTMLTextAreaElement> {
  const box = await screen.findByRole('textbox', { name }, { timeout: 2000 });
  expect(box.tagName, `the ${name} row's editing surface`).toBe('TEXTAREA');
  return box as HTMLTextAreaElement;
}

describe('CodeWidget — a failing Monaco loader falls back to an editable textarea (objectui#11858)', () => {
  it('the rows are what they claim: spec rows rendered through the code widget', () => {
    // Guards the premises, so a spec that renames a row or changes its type
    // fails here instead of turning the pins below into tests of nothing.
    expect(specRow(hookForm, ['body', 'source'])).toMatchObject({ type: 'code', language: 'javascript' });
    expect(specRow(fieldForm, ['visibleWhen'])).toMatchObject({ type: 'code', language: 'expression' });
    expect(FIELD_DRAFT.visibleWhen).toEqual({ dialect: 'cel', source: "record.type == 'invoice'", meta: META });
    expect(HookSchema.safeParse(HOOK_DRAFT).success, 'the hook fixture is a valid hook').toBe(true);
  });

  it('a hook body and a visibleWhen row are editable and save; one report, nothing uncaught, and a reopen adds nothing', async () => {
    const consoleError = vi.spyOn(console, 'error');
    const consoleWarn = vi.spyOn(console, 'warn');
    const onHookChange = vi.fn();
    const onFieldChange = vi.fn();

    // The hook edit page's form and the field drawer's form on one page, each
    // with several code rows; StrictMode doubles every effect, as the dev
    // build does.
    render(
      <React.StrictMode>
        <SchemaForm schema={HOOK_SCHEMA} form={HOOK_FORM} value={HOOK_DRAFT} onChange={onHookChange} />
        <SchemaForm
          schema={FIELD_SCHEMA}
          form={FIELD_FORM}
          idPath={DRAWER_EMBEDDED_ITEM_ID_SCOPE}
          value={FIELD_DRAFT}
          onChange={onFieldChange}
        />
      </React.StrictMode>,
    );
    // `visibleWhen` sits in the field form's collapsed Advanced section.
    const advanced = screen.getByText('Advanced').closest('button');
    expect(advanced, 'the Advanced section trigger').not.toBeNull();
    expect(advanced).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(advanced!);
    expect(advanced).toHaveAttribute('aria-expanded', 'true');
    await settle();

    expect(heldLoaderScripts, 'the loader appends its script once per page').toHaveLength(1);
    const [loaderScript] = heldLoaderScripts;
    // Before the network answers, no Monaco editor is mounted: it would show
    // its own "Loading..." and call `loader.init()` itself.
    expect(screen.queryByText('Loading...'), 'a Monaco editor mounted before the loader answered').toBeNull();

    // The network answers: the loader script failed to load.
    act(() => {
      loaderScript.dispatchEvent(new Event('error'));
    });

    const hookBody = await codeTextarea(/^source/i);
    const visibleWhen = await codeTextarea(/^visible when/i);
    expect(hookBody.value).toBe('return;');
    expect(visibleWhen.value, 'the envelope is read through its `source`').toBe("record.type == 'invoice'");

    // Edit both, and read what each form hands its host to save.
    fireEvent.change(hookBody, { target: { value: 'if (!ctx.record.amount) throw new Error("amount");' } });
    const savedHook = onHookChange.mock.lastCall?.[0] as Record<string, unknown>;
    expect(savedHook.body).toEqual({ language: 'js', source: 'if (!ctx.record.amount) throw new Error("amount");' });
    expect(HookSchema.safeParse(savedHook).success, 'the saved hook is a valid hook').toBe(true);

    fireEvent.change(visibleWhen, { target: { value: "record.type == 'credit_note'" } });
    const savedField = onFieldChange.mock.lastCall?.[0] as Record<string, unknown>;
    // The same write the editor makes: the envelope keeps `dialect` and `meta`.
    expect(savedField.visibleWhen).toEqual({ dialect: 'cel', source: "record.type == 'credit_note'", meta: META });
    expect(FieldSchema.safeParse(savedField).success, 'the saved field is a valid field').toBe(true);

    await settle();
    // Soft, so a regression reports every reading at once, not just the first.
    expect.soft(uncaught, 'uncaught rejections after the loader failed').toHaveLength(0);
    const editorInitErrors = consoleError.mock.calls.filter(
      ([first]) => typeof first === 'string' && first.startsWith('Monaco initialization'),
    );
    expect.soft(editorInitErrors, "<Editor>'s own init error lines").toHaveLength(0);
    const reports = monacoReports(consoleWarn.mock.calls);
    expect.soft(reports, 'console lines reporting the Monaco failure').toHaveLength(1);
    expect.soft(reports.join('\n'), 'the report names the loader script URL').toContain(loaderScript.src);
    expect.soft(screen.queryByText('Loading...'), 'a Monaco editor mounted after the failure').toBeNull();

    // Reopen: a code row mounted after the failure is known renders the
    // textarea at once, read-only when the row is, with no loading state.
    cleanup();
    render(
      <>
        <span id="required-when-label">Required when</span>
        <CodeWidget
          schema={{ type: 'string' }}
          fieldSpec={specRow(fieldForm, ['requiredWhen'])}
          value="record.stage == 'closed'"
          onChange={() => {}}
          readOnly
          ariaLabelledBy="required-when-label"
        />
      </>,
    );
    const reopened = screen.getByRole('textbox', { name: 'Required when' }) as HTMLTextAreaElement;
    expect(reopened.value).toBe("record.stage == 'closed'");
    expect(reopened.readOnly).toBe(true);
    await settle();

    expect.soft(uncaught, 'uncaught rejections after a reopen').toHaveLength(0);
    expect.soft(heldLoaderScripts, 'loader scripts after a reopen').toHaveLength(1);
    expect.soft(monacoReports(consoleWarn.mock.calls), 'reports after a reopen').toHaveLength(1);
  });
});
