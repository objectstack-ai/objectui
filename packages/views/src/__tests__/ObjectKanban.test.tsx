/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ObjectKanban } from '../ObjectKanban';
import type { ObjectGridSchema, DataSource } from '@object-ui/types';

describe('ObjectKanban', () => {
  let mockDataSource: DataSource;
  let mockSchema: ObjectGridSchema;

  beforeEach(() => {
    // Mock data source
    mockDataSource = {
      find: vi.fn().mockResolvedValue({
        data: [
          { _id: '1', title: 'Task 1', status: 'todo', priority: 'high' },
          { _id: '2', title: 'Task 2', status: 'in-progress', priority: 'medium' },
          { _id: '3', title: 'Task 3', status: 'done', priority: 'low' },
        ],
      }),
      getObjectSchema: vi.fn().mockResolvedValue({
        name: 'tasks',
        label: 'Tasks',
        fields: {
          title: { type: 'text', label: 'Title' },
          status: { type: 'select', label: 'Status' },
          priority: { type: 'select', label: 'Priority' },
        },
      }),
      update: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    // Mock schema with kanban config
    mockSchema = {
      type: 'object-grid',
      objectName: 'tasks',
      data: {
        provider: 'object',
        object: 'tasks',
      },
      filter: {
        kanban: {
          groupByField: 'status',
          columns: ['title', 'priority'],
        },
      },
    } as any;
  });

  it('should render loading state initially', () => {
    render(<ObjectKanban schema={mockSchema} dataSource={mockDataSource} />);
    expect(screen.getByText(/Loading kanban board/i)).toBeInTheDocument();
  });

  it('should fetch and display kanban data', async () => {
    render(<ObjectKanban schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(mockDataSource.find).toHaveBeenCalledWith('tasks', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  it('should group tasks by status field', async () => {
    render(<ObjectKanban schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText('todo')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText('done')).toBeInTheDocument();
    });
  });

  it('should render with inline data', async () => {
    const schemaWithInlineData = {
      ...mockSchema,
      data: {
        provider: 'value',
        items: [
          { id: '1', title: 'Task A', status: 'todo' },
          { id: '2', title: 'Task B', status: 'done' },
        ],
      },
    } as any;

    render(<ObjectKanban schema={schemaWithInlineData} />);

    await waitFor(() => {
      expect(screen.getByText('Task A')).toBeInTheDocument();
      expect(screen.getByText('Task B')).toBeInTheDocument();
    });
  });

  it('should show error when kanban config is missing', async () => {
    const schemaWithoutKanban = {
      ...mockSchema,
      filter: {},
    } as any;

    render(<ObjectKanban schema={schemaWithoutKanban} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText(/Kanban configuration required/i)).toBeInTheDocument();
    });
  });

  it('should handle card click events', async () => {
    const onCardClick = vi.fn();
    render(
      <ObjectKanban
        schema={mockSchema}
        dataSource={mockDataSource}
        onCardClick={onCardClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const card = screen.getByText('Task 1').closest('div');
    if (card) {
      card.click();
      expect(onCardClick).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Task 1' })
      );
    }
  });
});
