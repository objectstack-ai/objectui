/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { DataTableSchema } from '@object-ui/types';

// Import the component
import '../data-table';
import { ComponentRegistry } from '@object-ui/core';

describe('Data Table - Batch Editing', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  const mockColumns = [
    { header: 'ID', accessorKey: 'id', editable: false },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Age', accessorKey: 'age' },
  ];

  it('should track pending changes across multiple cells', async () => {
    const onRowSave = vi.fn();
    
    const schema: DataTableSchema = {
      type: 'data-table',
      columns: mockColumns,
      data: mockData,
      editable: true,
      pagination: false,
      searchable: false,
      rowActions: true,
      onRowSave,
    };

    const DataTableRenderer = ComponentRegistry.get('data-table');
    if (!DataTableRenderer) throw new Error('DataTableRenderer not found');

    const { container } = render(<DataTableRenderer schema={schema} />);
    
    // Edit first cell in row
    const nameCell = screen.getByText('John Doe').closest('td');
    if (nameCell) {
      fireEvent.doubleClick(nameCell);
      
      await waitFor(() => {
        const input = nameCell.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = nameCell.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'John Smith' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Wait for the edit to be saved to pending changes
    await waitFor(() => {
      const modifiedIndicator = screen.getByText(/1 row modified/i);
      expect(modifiedIndicator).toBeInTheDocument();
    });

    // Edit second cell in same row - now the name shows as 'John Smith'
    const emailCell = container.querySelector('td:has-text("john@example.com")') || 
                      Array.from(container.querySelectorAll('td')).find(el => 
                        el.textContent?.includes('john@example.com')
                      );
    
    expect(emailCell).toBeInTheDocument();
    if (emailCell) {
      fireEvent.doubleClick(emailCell);

      await waitFor(() => {
        const input = emailCell.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = emailCell.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'johnsmith@example.com' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Row should still show as modified (still just 1 row)
    await waitFor(() => {
      const modifiedIndicator = screen.getByText(/1 row modified/i);
      expect(modifiedIndicator).toBeInTheDocument();
    });
  });

  it('should save a single row with multiple changes', async () => {
    const onRowSave = vi.fn().mockResolvedValue(undefined);
    
    const schema: DataTableSchema = {
      type: 'data-table',
      columns: mockColumns,
      data: mockData,
      editable: true,
      pagination: false,
      searchable: false,
      rowActions: true,
      onRowSave,
    };

    const DataTableRenderer = ComponentRegistry.get('data-table');
    if (!DataTableRenderer) throw new Error('DataTableRenderer not found');

    render(<DataTableRenderer schema={schema} />);
    
    // Edit name
    const nameCell = screen.getByText('John Doe').closest('td');
    if (nameCell) {
      fireEvent.doubleClick(nameCell);
      await waitFor(() => {
        const input = nameCell.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = nameCell.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'John Smith' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Find and click save button for row
    await waitFor(() => {
      const saveButtons = screen.getAllByTitle('Save row');
      expect(saveButtons.length).toBeGreaterThan(0);
      fireEvent.click(saveButtons[0]);
    });

    // Verify callback was called with correct data
    await waitFor(() => {
      expect(onRowSave).toHaveBeenCalledWith(
        0,
        { name: 'John Smith' },
        mockData[0]
      );
    });
  });

  it('should save all modified rows with batch save', async () => {
    const onBatchSave = vi.fn().mockResolvedValue(undefined);
    
    const schema: DataTableSchema = {
      type: 'data-table',
      columns: mockColumns,
      data: mockData,
      editable: true,
      pagination: false,
      searchable: false,
      onBatchSave,
    };

    const DataTableRenderer = ComponentRegistry.get('data-table');
    if (!DataTableRenderer) throw new Error('DataTableRenderer not found');

    render(<DataTableRenderer schema={schema} />);
    
    // Edit row 1
    const nameCell1 = screen.getByText('John Doe').closest('td');
    if (nameCell1) {
      fireEvent.doubleClick(nameCell1);
      await waitFor(() => {
        const input = nameCell1.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = nameCell1.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'John Smith' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Edit row 2
    await waitFor(() => {
      const nameCell2 = screen.getByText('Jane Smith').closest('td');
      expect(nameCell2).toBeInTheDocument();
    });

    const nameCell2 = screen.getByText('Jane Smith').closest('td');
    if (nameCell2) {
      fireEvent.doubleClick(nameCell2);
      await waitFor(() => {
        const input = nameCell2.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = nameCell2.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'Jane Doe' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Click save all button
    await waitFor(() => {
      const saveAllButton = screen.getByText(/Save All \(2\)/i);
      expect(saveAllButton).toBeInTheDocument();
      fireEvent.click(saveAllButton);
    });

    // Verify callback was called
    await waitFor(() => {
      expect(onBatchSave).toHaveBeenCalledWith([
        { rowIndex: 0, changes: { name: 'John Smith' }, row: mockData[0] },
        { rowIndex: 1, changes: { name: 'Jane Doe' }, row: mockData[1] },
      ]);
    });
  });

  it('should cancel all changes', async () => {
    const onBatchSave = vi.fn();
    
    const schema: DataTableSchema = {
      type: 'data-table',
      columns: mockColumns,
      data: mockData,
      editable: true,
      pagination: false,
      searchable: false,
      onBatchSave,
    };

    const DataTableRenderer = ComponentRegistry.get('data-table');
    if (!DataTableRenderer) throw new Error('DataTableRenderer not found');

    render(<DataTableRenderer schema={schema} />);
    
    // Edit a cell
    const nameCell = screen.getByText('John Doe').closest('td');
    if (nameCell) {
      fireEvent.doubleClick(nameCell);
      await waitFor(() => {
        const input = nameCell.querySelector('input');
        expect(input).toBeInTheDocument();
      });
      
      const input = nameCell.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: 'John Smith' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      }
    }

    // Click cancel all button
    await waitFor(() => {
      const cancelButton = screen.getByText(/Cancel All/i);
      expect(cancelButton).toBeInTheDocument();
      fireEvent.click(cancelButton);
    });

    // Verify changes indicator is gone
    await waitFor(() => {
      const modifiedIndicator = screen.queryByText(/row modified/i);
      expect(modifiedIndicator).not.toBeInTheDocument();
    });

    // Original value should be restored
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
