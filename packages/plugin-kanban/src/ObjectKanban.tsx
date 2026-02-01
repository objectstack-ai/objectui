/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import type { DataSource } from '@object-ui/types';
import { useDataScope } from '@object-ui/react';
import { KanbanRenderer } from './index';
import { KanbanSchema } from './types';

export interface ObjectKanbanProps {
  schema: KanbanSchema;
  dataSource?: DataSource;
  className?: string; // Allow override
}

export const ObjectKanban: React.FC<ObjectKanbanProps> = ({
  schema,
  dataSource,
  className,
}) => {
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  // loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve bound data if 'bind' property exists
  const boundData = useDataScope(schema.bind);

  useEffect(() => {
    const fetchData = async () => {
        if (!dataSource || !schema.objectName) return;
        setLoading(true);
        try {
            // Simple find for now, usually we might want filters
            // Using a large limit or pagination would be needed for real apps,
            // for now, we assume a reasonable default.
            const results = await dataSource.find(schema.objectName, {
                options: { $top: 100 } // Fetch up to 100 cards
            });
            // Handle { value: [] } OData shape or { data: [] } shape or direct array
            let data = results;
            if ((results as any).value) {
                data = (results as any).value;
            } else if ((results as any).data) {
                data = (results as any).data;
            }

            if (Array.isArray(data)) {
                setFetchedData(data);
            }
        } catch (e) {
            console.error(e);
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch if we have an objectName AND verify no inline/bound data overrides it
    if (schema.objectName && !boundData && !schema.data) {
        fetchData();
    }
  }, [schema.objectName, dataSource, boundData, schema.data]);

  // Determine which data to use: bound -> inline -> fetched
  const effectiveData = boundData || schema.data || fetchedData;

  // Clone schema to inject data and className
  const effectiveSchema = {
      ...schema,
      data: effectiveData,
      className: className || schema.className
  };

  if (error) {
      return (
        <div className="p-4 border border-destructive/50 rounded bg-destructive/10 text-destructive">
            Error loading kanban data: {error.message}
        </div>
      );
  }

  // Pass through to the renderer
  return <KanbanRenderer schema={effectiveSchema} />;
}
