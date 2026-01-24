/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ColDef, GridOptions, CellClickedEvent, RowClickedEvent, SelectionChangedEvent, CellValueChangedEvent } from 'ag-grid-community';

/**
 * Event callback types
 */
export interface AgGridCallbacks {
  onCellClicked?: (event: CellClickedEvent) => void;
  onRowClicked?: (event: RowClickedEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  onCellValueChanged?: (event: CellValueChangedEvent) => void;
  onExport?: (data: any[], format: 'csv' | 'excel') => void;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  enabled?: boolean;
  fileName?: string;
  formats?: ('csv' | 'excel')[];
  includeHeaders?: boolean;
  skipColumnHeaders?: boolean;
  allColumns?: boolean;
  onlySelected?: boolean;
}

/**
 * Status bar configuration
 */
export interface StatusBarConfig {
  enabled?: boolean;
  aggregations?: ('sum' | 'avg' | 'count' | 'min' | 'max')[];
}

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
  
  // Editing
  editable?: boolean;
  editType?: 'fullRow';
  singleClickEdit?: boolean;
  stopEditingWhenCellsLoseFocus?: boolean;
  
  // Export
  exportConfig?: ExportConfig;
  
  // Status bar
  statusBar?: StatusBarConfig;
  
  // Event callbacks
  callbacks?: AgGridCallbacks;
  
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
