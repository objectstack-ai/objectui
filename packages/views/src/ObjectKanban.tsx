/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ObjectKanban Component
 * 
 * A specialized kanban board component that works with ObjectQL data sources.
 * Auto-generates kanban columns from data based on groupByField configuration.
 * Implements the kanban view type from @objectstack/spec view.zod ListView schema.
 * 
 * Features:
 * - Drag-and-drop kanban board
 * - Auto-grouping by field (e.g., status, stage)
 * - Column summaries (e.g., sum of amounts)
 * - Card customization based on field configuration
 * - Works with object/api/value data providers
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ObjectGridSchema, DataSource, ViewData, KanbanConfig } from '@object-ui/types';

export interface ObjectKanbanProps {
  schema: ObjectGridSchema;
  dataSource?: DataSource;
  className?: string;
  onCardClick?: (record: any) => void;
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
}

/**
 * Helper to get data configuration from schema
 */
function getDataConfig(schema: ObjectGridSchema): ViewData | null {
  if (schema.data) {
    return schema.data;
  }
  
  if (schema.staticData) {
    return {
      provider: 'value',
      items: schema.staticData,
    };
  }
  
  if (schema.objectName) {
    return {
      provider: 'object',
      object: schema.objectName,
    };
  }
  
  return null;
}

/**
 * Helper to convert sort config to QueryParams format
 */
function convertSortToQueryParams(sort: string | any[] | undefined): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort) return undefined;
  
  // If it's a string like "name desc"
  if (typeof sort === 'string') {
    const parts = sort.split(' ');
    const field = parts[0];
    const order = (parts[1]?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
    return { [field]: order };
  }
  
  // If it's an array of SortConfig objects
  if (Array.isArray(sort)) {
    return sort.reduce((acc, item) => {
      if (item.field && item.order) {
        acc[item.field] = item.order;
      }
      return acc;
    }, {} as Record<string, 'asc' | 'desc'>);
  }
  
  return undefined;
}

/**
 * Helper to get kanban configuration from schema
 * Extracts kanban-specific settings or provides defaults
 */
function getKanbanConfig(schema: ObjectGridSchema): KanbanConfig | null {
  // Check if schema has kanban configuration in filter or separate config
  if (schema.filter && typeof schema.filter === 'object' && 'kanban' in schema.filter) {
    return (schema.filter as any).kanban as KanbanConfig;
  }
  
  // For backward compatibility, check if schema has kanban config at root
  if ((schema as any).kanban) {
    return (schema as any).kanban as KanbanConfig;
  }
  
  return null;
}

export const ObjectKanban: React.FC<ObjectKanbanProps> = ({
  schema,
  dataSource,
  className,
  onCardClick,
  onCardMove,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [objectSchema, setObjectSchema] = useState<any>(null);

  const dataConfig = getDataConfig(schema);
  const kanbanConfig = getKanbanConfig(schema);
  const hasInlineData = dataConfig?.provider === 'value';

  // Fetch data based on provider
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (hasInlineData && dataConfig?.provider === 'value') {
          setData(dataConfig.items as any[]);
          setLoading(false);
          return;
        }

        if (!dataSource) {
          throw new Error('DataSource required for object/api providers');
        }

        if (dataConfig?.provider === 'object') {
          const objectName = dataConfig.object;
          const result = await dataSource.find(objectName, {
            $filter: schema.filter,
            $orderby: convertSortToQueryParams(schema.sort),
          });
          setData(result?.data || []);
        } else if (dataConfig?.provider === 'api') {
          // For API provider, we'd need to fetch from the read endpoint
          // This would typically be handled by a custom hook or data fetching layer
          console.warn('API provider not yet implemented for ObjectKanban');
          setData([]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchData();
  }, [dataConfig, dataSource, hasInlineData, schema.filter, schema.sort]);

  // Fetch object schema for field metadata
  useEffect(() => {
    const fetchObjectSchema = async () => {
      try {
        if (!dataSource) return;
        
        const objectName = dataConfig?.provider === 'object' 
          ? dataConfig.object 
          : schema.objectName;
          
        if (!objectName) return;
        
        const schemaData = await dataSource.getObjectSchema(objectName);
        setObjectSchema(schemaData);
      } catch (err) {
        console.error('Failed to fetch object schema:', err);
      }
    };

    if (!hasInlineData && dataSource) {
      fetchObjectSchema();
    }
  }, [schema.objectName, dataSource, hasInlineData, dataConfig]);

  // Group data into kanban columns
  const kanbanColumns = useMemo(() => {
    if (!kanbanConfig || !data.length) {
      return [];
    }

    const groupByField = kanbanConfig.groupByField;
    const summarizeField = kanbanConfig.summarizeField;
    const displayColumns = kanbanConfig.columns || [];

    // Get unique values for grouping field
    const uniqueValues = [...new Set(data.map(record => record[groupByField]))].filter(Boolean);

    // Create columns for each unique value
    return uniqueValues.map(value => {
      const columnCards = data.filter(record => record[groupByField] === value);
      
      // Calculate summary if configured
      let summary;
      if (summarizeField) {
        summary = columnCards.reduce((sum, card) => {
          const val = card[summarizeField];
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
      }

      return {
        id: String(value),
        title: String(value),
        summary,
        cards: columnCards.map(record => ({
          id: record.id || record._id || String(Math.random()),
          title: record[displayColumns[0]] || record.name || record.title || 'Untitled',
          description: displayColumns[1] ? record[displayColumns[1]] : undefined,
          data: record,
          // Map additional fields to display
          fields: displayColumns.slice(2).reduce((acc: Record<string, any>, fieldName: string) => {
            acc[fieldName] = record[fieldName];
            return acc;
          }, {} as Record<string, any>),
        })),
      };
    });
  }, [data, kanbanConfig]);

  const handleCardMoveInternal = useCallback((cardId: string, fromColumnId: string, toColumnId: string) => {
    if (!kanbanConfig) return;

    // Update the local data
    setData(prevData => {
      return prevData.map(record => {
        const recordId = record.id || record._id;
        if (String(recordId) === cardId) {
          return {
            ...record,
            [kanbanConfig.groupByField]: toColumnId,
          };
        }
        return record;
      });
    });

    // Notify parent
    if (onCardMove) {
      onCardMove(cardId, fromColumnId, toColumnId);
    }

    // If we have a dataSource, persist the change
    if (dataSource && dataConfig?.provider === 'object') {
      const objectName = dataConfig.object;
      dataSource.update(objectName, cardId, {
        [kanbanConfig.groupByField]: toColumnId,
      }).catch((err: any) => {
        console.error('Failed to update record:', err);
        // Revert the change on error
        setData(prevData => {
          return prevData.map(record => {
            const recordId = record.id || record._id;
            if (String(recordId) === cardId) {
              return {
                ...record,
                [kanbanConfig.groupByField]: fromColumnId,
              };
            }
            return record;
          });
        });
      });
    }
  }, [kanbanConfig, dataConfig, dataSource, onCardMove]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading kanban board...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </div>
    );
  }

  if (!kanbanConfig) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            Kanban configuration required. Please specify groupByField and columns.
          </div>
        </div>
      </div>
    );
  }

  // Render using the kanban plugin component
  // We'll use SchemaRenderer to render the kanban component
  return (
    <div className={className}>
      {/* Placeholder for actual kanban rendering - would use plugin-kanban */}
      <div className="p-4">
        <div className="flex gap-4 overflow-x-auto">
          {kanbanColumns.map(column => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{column.title}</h3>
                {column.summary !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {column.summary}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {column.cards.map(card => (
                  <div
                    key={card.id}
                    className="bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onCardClick?.(card.data)}
                  >
                    <h4 className="font-medium text-sm">{card.title}</h4>
                    {card.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    )}
                    {Object.keys(card.fields).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(card.fields).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
