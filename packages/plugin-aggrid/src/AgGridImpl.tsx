/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridOptions } from 'ag-grid-community';

export interface AgGridImplProps {
  rowData?: any[];
  columnDefs?: ColDef[];
  gridOptions?: GridOptions;
  pagination?: boolean;
  paginationPageSize?: number;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  animateRows?: boolean;
  rowSelection?: 'single' | 'multiple';
  theme?: 'alpine' | 'balham' | 'material' | 'quartz';
  height?: number | string;
  className?: string;
}

/**
 * AgGridImpl - The heavy implementation that imports AG Grid
 * This component is lazy-loaded to avoid including AG Grid in the initial bundle
 */
export default function AgGridImpl({
  rowData = [],
  columnDefs = [],
  gridOptions = {},
  pagination = false,
  paginationPageSize = 10,
  domLayout = 'normal',
  animateRows = true,
  rowSelection,
  theme = 'quartz',
  height = 500,
  className = '',
}: AgGridImplProps) {
  // Merge grid options with props
  const mergedGridOptions: GridOptions = useMemo(() => ({
    ...gridOptions,
    pagination,
    paginationPageSize,
    domLayout,
    animateRows,
    rowSelection,
    // Default options for better UX
    suppressCellFocus: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
  }), [gridOptions, pagination, paginationPageSize, domLayout, animateRows, rowSelection]);

  // Compute container style
  const containerStyle = useMemo(() => ({
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
  }), [height]);

  // Determine theme class and build complete class list
  const themeClass = `ag-theme-${theme}`;
  const classList = [
    themeClass,
    'rounded-xl',
    'border',
    'border-border',
    'overflow-hidden',
    'shadow-lg',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classList}
      style={containerStyle}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        gridOptions={mergedGridOptions}
      />
    </div>
  );
}
