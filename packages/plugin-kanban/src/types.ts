/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BaseSchema } from '@object-ui/types';

/**
 * Kanban card interface.
 */
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  [key: string]: any;
}

/**
 * Kanban column interface.
 */
export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  limit?: number;
  className?: string;
}

/**
 * Kanban Board component schema.
 * Renders a drag-and-drop kanban board for task management.
 */
export interface KanbanSchema extends BaseSchema {
  type: 'kanban';
  
  /**
   * Object name to fetch data from.
   */
  objectName?: string;

  /**
   * Field to group records by (maps to column IDs).
   */
  groupBy?: string;

  /**
   * Static data or bound data.
   */
  data?: any[];

  /**
   * Array of columns to display in the kanban board.
   * Each column contains an array of cards.
   */
  columns?: KanbanColumn[];
  
  /**
   * Callback function when a card is moved between columns or reordered.
   */
  onCardMove?: (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  
  /**
   * Optional CSS class name to apply custom styling.
   */
  className?: string;
}
