/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11440 — the `app-schema-renderer` registration and its zod arm.
 *
 * `@object-ui/types/zod`'s `AppSchemaRendererNodeSchema` declares two of the
 * registration's three inputs, each as the registration types it:
 * `mobileNavMode` (the same two-value enum) and `basePath` (a string). The
 * third input, `schema`, is NOT declared, because no node delivers it:
 * `SchemaRenderer` strips the `schema` key and hands the component the NODE as
 * its `schema` prop. The last row measures that through the real
 * `SchemaRenderer` and registry, so the arm's omission is a reading, not an
 * assumption: navigation nested under `schema` draws nothing, and the same
 * navigation on the node draws.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRenderer } from '@object-ui/react';
import { AppSchemaRendererNodeSchema } from '@object-ui/types/zod';
import { registerLayout } from '../index';

beforeAll(() => {
  registerLayout();
});

type Input = { name: string; type: string; enum?: unknown[] };

const inputs = (): Input[] =>
  ((ComponentRegistry.getConfig('app-schema-renderer', 'layout') as { inputs?: Input[] } | undefined)?.inputs ?? []);

describe('app-schema-renderer — registration inputs and the arm (objectui#11440)', () => {
  it('`mobileNavMode`: the arm\'s enum is the registration\'s enum', () => {
    const declared = inputs().find((input) => input.name === 'mobileNavMode');
    const arm = (AppSchemaRendererNodeSchema.shape.mobileNavMode as unknown as { unwrap: () => { options: string[] } }).unwrap();
    expect(declared?.type).toBe('enum');
    expect([...arm.options].sort()).toEqual([...(declared?.enum as string[])].sort());
  });

  it('`basePath` is a string input on both', () => {
    expect(inputs().find((input) => input.name === 'basePath')?.type).toBe('string');
    expect(AppSchemaRendererNodeSchema.shape.basePath.safeParse('/apps/crm').success).toBe(true);
    expect(AppSchemaRendererNodeSchema.shape.basePath.safeParse(7).success).toBe(false);
  });

  it('`schema` is an input the arm does not declare — and a node never delivers it to the component', () => {
    expect(inputs().map((input) => input.name)).toContain('schema');
    expect(Object.keys(AppSchemaRendererNodeSchema.shape)).not.toContain('schema');

    const nested = { type: 'app-schema-renderer', schema: { name: 'crm', navigation: [{ id: 'n1', type: 'url', label: 'NestedNav11440', url: '/x' }] } };
    const onNode = { type: 'app-schema-renderer', name: 'crm', navigation: [{ id: 'n2', type: 'url', label: 'NodeNav11440', url: '/y' }] };
    const drawn = (node: unknown) =>
      render(<MemoryRouter><SchemaRenderer schema={node as never} /></MemoryRouter>).container.innerHTML;
    expect(drawn(nested)).not.toContain('NestedNav11440');
    // Lit control: the same navigation written on the node is drawn.
    expect(drawn(onNode)).toContain('NodeNav11440');
  });
});
