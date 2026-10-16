/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12584 — the boolean cell's plain checkbox is named by its field.
 *
 * `BooleanCellRenderer` has three outcomes for a real boolean. Two already
 * named themselves: the completion indicator (`role="img"`, "Completed" /
 * "Not completed") and the status field's off badge ("LABEL — Off"). The
 * third, the plain read-only checkbox every other boolean column draws, had
 * no `aria-label`, no `aria-labelledby` and no text beside it, so a screen
 * reader announced each grid cell as a bare "checkbox, not checked" with no
 * field (measured on the Studio Records grid, HotCRM Account `is_active`).
 *
 * The name is the field's words, the ones the off badge already prints: its
 * label, else its humanized name. It carries no state word: the `checkbox`
 * role announces checked / not checked itself.
 *
 * Every naming case is found by `getByRole('checkbox', { name })`, so it reads
 * the name off the element that carries the role (Radix's button), not off a
 * wrapper. Every case renders through the registry exactly as a grid host
 * resolves a read-mode cell, for both types that map to this renderer.
 *
 * The CONTROL block pins what this change must leave alone: the completion
 * indicator's two names, the off badge's text, and the non-boolean
 * `EmptyValue` outcome with no checkbox in it.
 */

import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCellRenderer, resolveCellRendererType } from '../index';

afterEach(() => cleanup());

const TYPES = ['boolean', 'toggle'] as const;

/** Resolve + render exactly the way a consumer builds a read-mode cell. */
function renderCell(type: string, value: unknown, field: Record<string, unknown>) {
  const Renderer = getCellRenderer(resolveCellRendererType({ type }) || type);
  return render(<Renderer value={value} field={{ type, ...field } as never} />);
}

describe('objectui#12584 — the boolean cell checkbox is named by its field', () => {
  for (const type of TYPES) {
    describe(`\`${type}\``, () => {
      it('a labelled field: a checked box is named by the label', () => {
        renderCell(type, true, { name: 'is_preferred', label: 'Preferred' });
        const box = screen.getByRole('checkbox', { name: 'Preferred' });
        expect(box).toBeChecked();
      });

      it('a labelled field: an unchecked box is named by the label', () => {
        renderCell(type, false, { name: 'is_preferred', label: 'Preferred' });
        const box = screen.getByRole('checkbox', { name: 'Preferred' });
        expect(box).not.toBeChecked();
      });

      it('an unlabelled field falls back to the humanized name', () => {
        renderCell(type, true, { name: 'is_preferred' });
        expect(screen.getByRole('checkbox', { name: 'Is Preferred' })).toBeChecked();
      });

      it('an unlabelled mixed-case name keeps the spelling it was authored with', () => {
        // The renderer matches on the lower-cased name; the words it draws
        // read the name as authored, or this read `Ispreferred`.
        renderCell(type, false, { name: 'IsPreferred' });
        expect(screen.getByRole('checkbox', { name: 'IsPreferred' })).not.toBeChecked();
      });

      it('a status field that is on draws the box, named by the label (the measured HotCRM `is_active` cell)', () => {
        renderCell(type, true, { name: 'is_active', label: 'Active' });
        expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked();
      });
    });
  }
});

describe('objectui#12584 — CONTROL: the outcomes that already named themselves are unchanged', () => {
  it('the completion indicator keeps its two names and draws no checkbox', () => {
    renderCell('boolean', true, { name: 'completed', label: 'Done?' });
    expect(screen.getByRole('img', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).toBeNull();
    cleanup();

    renderCell('boolean', false, { name: 'is_done' });
    expect(screen.getByRole('img', { name: 'Not completed' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('the off badge keeps its text and draws no checkbox', () => {
    const labelled = renderCell('boolean', false, { name: 'is_active', label: 'Active' });
    expect(labelled.getByTestId('boolean-warning-badge')).toHaveTextContent(/^Active — Off$/);
    expect(screen.queryByRole('checkbox')).toBeNull();
    cleanup();

    const unlabelled = renderCell('boolean', false, { name: 'is_active' });
    expect(unlabelled.getByTestId('boolean-warning-badge')).toHaveTextContent(/^Is Active — Off$/);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('a non-boolean value draws the EmptyValue affordance and no checkbox', () => {
    const { container } = renderCell('boolean', 'true', { name: 'is_preferred', label: 'Preferred' });
    expect(screen.queryByRole('checkbox')).toBeNull();
    const empty = container.querySelector<HTMLElement>('[data-slot="empty-value"]');
    expect(empty, 'the shared EmptyValue affordance must be present').not.toBeNull();
    expect(empty?.getAttribute('aria-label')).toBe('No value');
  });
});
