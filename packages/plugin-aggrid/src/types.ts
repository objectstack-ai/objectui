/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ColDef, GridOptions } from 'ag-grid-community';

/**
 * AG Grid schema for ObjectUI
 */
export interface AgGridSchema {
  type: 'aggrid';
  id?: string;
  className?: string;
  
  // Data
  rowData?: any[];
  
  // Column definitions
  columnDefs?: ColDef[];
  
  // Grid configuration
  gridOptions?: GridOptions;
  
  // Common options
  pagination?: boolean;
  paginationPageSize?: number;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  animateRows?: boolean;
  rowSelection?: 'single' | 'multiple';
  
  // Styling
  theme?: 'alpine' | 'balham' | 'material' | 'quartz';
  height?: number | string;
}

/**
 * Column definition with simplified schema
 */
export interface SimpleColumnDef {
  field: string;
  headerName?: string;
  width?: number;
  sortable?: boolean;
  filter?: boolean | 'text' | 'number' | 'date';
  editable?: boolean;
  cellRenderer?: string;
  valueFormatter?: (params: any) => string;
}
