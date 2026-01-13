import React, { useState, useEffect } from 'react';

export interface AwesomeTableProps {
  /** ObjectQL object name */
  object: string;
  /** Column definitions */
  columns?: Array<{
    field: string;
    label?: string;
    width?: number;
    sortable?: boolean;
  }>;
  /** Enable sorting */
  sortable?: boolean;
  /** Enable filtering */
  filterable?: boolean;
  /** Enable pagination */
  paginated?: boolean;
  /** Page size */
  pageSize?: number;
  /** Row click handler */
  onRowClick?: (row: any, index: number) => void;
}

/**
 * AwesomeTable - Advanced data table component
 * 
 * @example
 * ```tsx
 * <AwesomeTable
 *   object="projects"
 *   columns={[{ field: 'name', label: 'Name' }]}
 *   sortable={true}
 * />
 * ```
 */
export const AwesomeTable: React.FC<AwesomeTableProps> = ({
  object,
  columns = [],
  sortable = true,
  filterable = true,
  paginated = true,
  pageSize = 25,
  onRowClick
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load data from ObjectQL
    setLoading(false);
  }, [object]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="awesome-table bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Awesome Table: {object}</h3>
        <div className="text-gray-600">
          This is a UMD-packaged component for ObjectQL
        </div>
      </div>
    </div>
  );
};

export default AwesomeTable;
