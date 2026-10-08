// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11880 — the page designer writes an `element:*` block's data
 * binding into the node-level `dataSource`, the one place the renderer reads it.
 *
 * `element:repeater` and `element:number` read their object (and the repeater
 * its row cap) from `dataSource` only (objectstack#11509, ruled A-narrow). The
 * inspector's curated Object picker and the repeater's Limit box wrote
 * `properties.object` / `properties.limit` — keys the renderers no longer
 * read, so a block built in Studio would render nothing. These rows drive the
 * REAL inspector and assert the patch it hands the editor: the value lands at
 * node level under `dataSource`, never under `properties`, and the field
 * pickers resolve their object from `dataSource.object`.
 */

import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PageSchema } from '@objectstack/spec/ui';
import { PageBlockInspector } from './PageBlockInspector';
import type { MetadataInspectorProps } from '../inspector-registry';

// The field catalog hook, observed: which object each field picker asked for.
const fieldsFor = vi.hoisted(() => vi.fn((_objectName: string | undefined) => undefined));
vi.mock('../previews/useObjectFields', () => ({
  useObjectFields: (objectName: string | undefined) => {
    fieldsFor(objectName);
    return {
      fields: objectName ? [{ name: 'email', label: 'Email', type: 'text', hidden: false }] : [],
      loading: false,
      error: null,
    };
  },
}));
// No object catalog: the Object picker falls back to its labelled text box.
vi.mock('../useMetadata', () => ({
  useMetadataClient: () => ({ get: vi.fn(async () => undefined), list: vi.fn(async () => [] as unknown[]) }),
}));

afterEach(() => {
  cleanup();
  fieldsFor.mockClear();
});

const BLOCK_PATH = 'regions[0].components[0]';

/** Author a page the way a user does, parse it with the spec, and hand the RESULT to the inspector. */
function pageDraft(block: Record<string, unknown>): Record<string, unknown> {
  return PageSchema.parse({
    name: 'home',
    label: 'Home',
    type: 'home',
    template: 'default',
    regions: [{ name: 'main', components: [{ id: 'b1', ...block }] }],
  }) as unknown as Record<string, unknown>;
}

function renderInspector(draft: Record<string, unknown>): Mock<MetadataInspectorProps['onPatch']> {
  const onPatch: Mock<MetadataInspectorProps['onPatch']> = vi.fn();
  render(
    <PageBlockInspector
      type="page"
      name="home"
      draft={draft}
      selection={{ kind: 'block', id: BLOCK_PATH }}
      onPatch={onPatch}
      onClearSelection={() => {}}
      readOnly={false}
      locale="en-US"
    />,
  );
  return onPatch;
}

/** The block as the inspector last wrote it (the patch is shallow: `{ regions }`). */
const committedBlock = (onPatch: Mock<MetadataInspectorProps['onPatch']>): Record<string, unknown> =>
  (onPatch.mock.calls.at(-1)![0] as any).regions[0].components[0];

describe('the designer writes the node-level `dataSource` for the element blocks (objectui#11880)', () => {
  it.each(['element:repeater', 'element:number'])('%s: the Object picker writes `dataSource.object`, not `properties.object`', (type) => {
    const onPatch = renderInspector(pageDraft({ type, properties: {} }));
    fireEvent.change(screen.getByLabelText('Object'), { target: { value: 'contact' } });
    const block = committedBlock(onPatch);
    expect(block.dataSource).toEqual({ object: 'contact' });
    expect(block.properties).toEqual({});
  });

  it('element:repeater: the Limit box writes `dataSource.limit`, beside the bound object', () => {
    const onPatch = renderInspector(pageDraft({ type: 'element:repeater', dataSource: { object: 'contact' } }));
    fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '5' } });
    const block = committedBlock(onPatch);
    expect(block.dataSource).toEqual({ object: 'contact', limit: 5 });
    expect(block.properties).toBeUndefined();
  });

  it('CONTROL: a display control on the same block still writes `properties`', () => {
    const onPatch = renderInspector(pageDraft({ type: 'element:repeater', dataSource: { object: 'contact' } }));
    fireEvent.change(screen.getByLabelText('Empty text'), { target: { value: 'None yet' } });
    const block = committedBlock(onPatch);
    expect(block.properties).toEqual({ emptyText: 'None yet' });
    expect(block.dataSource).toEqual({ object: 'contact' });
  });

  it.each([
    ['element:repeater', ['Title field', 'Fields']],
    ['element:number', ['Field']],
  ])('%s: the field pickers read their object from `dataSource.object`', (type) => {
    renderInspector(pageDraft({ type, dataSource: { object: 'contact' }, properties: { object: 'lead' } }));
    const asked = new Set(fieldsFor.mock.calls.map((call) => call[0]));
    expect(asked).toContain('contact');
    expect(asked).not.toContain('lead');
  });

  it('the Object picker shows the bound object, and a stored flat `properties.object` stays visible under Advanced', () => {
    renderInspector(pageDraft({ type: 'element:number', dataSource: { object: 'contact' }, properties: { object: 'lead' } }));
    expect((screen.getByLabelText('Object') as HTMLInputElement).value).toBe('contact');
    // The Advanced editor labels a generic property by its key.
    expect((screen.getByLabelText('object') as HTMLInputElement).value).toBe('lead');
  });
});
