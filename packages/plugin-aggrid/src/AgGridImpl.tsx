/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridOptions, GridReadyEvent, CellClickedEvent, RowClickedEvent, SelectionChangedEvent, CellValueChangedEvent, StatusPanelDef } from 'ag-grid-community';
import type { AgGridCallbacks, ExportConfig, StatusBarConfig } from './types';

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
  editable?: boolean;
  editType?: 'fullRow';
  singleClickEdit?: boolean;
  stopEditingWhenCellsLoseFocus?: boolean;
  exportConfig?: ExportConfig;
  statusBar?: StatusBarConfig;
  callbacks?: AgGridCallbacks;
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
  editable = false,
  editType,
  singleClickEdit = false,
  stopEditingWhenCellsLoseFocus = true,
  exportConfig,
  statusBar,
  callbacks,
}: AgGridImplProps) {
  const gridRef = useRef<any>(null);

  // Build status bar panels
  const statusPanels = useMemo((): StatusPanelDef[] | undefined => {
    if (!statusBar?.enabled) return undefined;
    
    const aggregations = statusBar.aggregations || ['count', 'sum', 'avg'];
    const panels: StatusPanelDef[] = [];
    
    if (aggregations.includes('count')) {
      panels.push({ statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['count'] } });
    }
    if (aggregations.includes('sum')) {
      panels.push({ statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['sum'] } });
    }
    if (aggregations.includes('avg')) {
      panels.push({ statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['avg'] } });
    }
    if (aggregations.includes('min')) {
      panels.push({ statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['min'] } });
    }
    if (aggregations.includes('max')) {
      panels.push({ statusPanel: 'agAggregationComponent', statusPanelParams: { aggFuncs: ['max'] } });
    }
    
    return panels;
  }, [statusBar]);

  // CSV Export handler
  const handleExportCSV = useCallback(() => {
    if (!gridRef.current) return;
    
    const params = {
      fileName: exportConfig?.fileName || 'export.csv',
      skipColumnHeaders: exportConfig?.skipColumnHeaders || false,
      allColumns: exportConfig?.allColumns || false,
      onlySelected: exportConfig?.onlySelected || false,
    };
    
    gridRef.current.api.exportDataAsCsv(params);
    
    if (callbacks?.onExport) {
      const data = exportConfig?.onlySelected 
        ? gridRef.current.api.getSelectedRows()
        : rowData;
      callbacks.onExport(data || [], 'csv');
    }
  }, [exportConfig, callbacks, rowData]);

  // Event handlers
  const handleCellClicked = useCallback((event: CellClickedEvent) => {
    callbacks?.onCellClicked?.(event);
  }, [callbacks]);

  const handleRowClicked = useCallback((event: RowClickedEvent) => {
    callbacks?.onRowClicked?.(event);
  }, [callbacks]);

  const handleSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    callbacks?.onSelectionChanged?.(event);
  }, [callbacks]);

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    callbacks?.onCellValueChanged?.(event);
  }, [callbacks]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params;
  }, []);

  // Make columns editable if global editable flag is set
  const processedColumnDefs = useMemo(() => {
    if (!editable) return columnDefs;
    
    return columnDefs.map(col => ({
      ...col,
      editable: col.editable !== undefined ? col.editable : true,
    }));
  }, [columnDefs, editable]);

  // Merge grid options with props
  const mergedGridOptions: GridOptions = useMemo(() => ({
    ...gridOptions,
    pagination,
    paginationPageSize,
    domLayout,
    animateRows,
    rowSelection,
    editType,
    singleClickEdit,
    stopEditingWhenCellsLoseFocus,
    statusBar: statusPanels ? { statusPanels } : undefined,
    // Default options for better UX
    suppressCellFocus: !editable,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    // Event handlers
    onCellClicked: handleCellClicked,
    onRowClicked: handleRowClicked,
    onSelectionChanged: handleSelectionChanged,
    onCellValueChanged: handleCellValueChanged,
    onGridReady,
  }), [
    gridOptions, 
    pagination, 
    paginationPageSize, 
    domLayout, 
    animateRows, 
    rowSelection,
    editType,
    singleClickEdit,
    stopEditingWhenCellsLoseFocus,
    statusPanels,
    editable,
    handleCellClicked,
    handleRowClicked,
    handleSelectionChanged,
    handleCellValueChanged,
    onGridReady,
  ]);

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
    <div className="ag-grid-container">
      {exportConfig?.enabled && (
        <div className="mb-2 flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Export CSV
          </button>
        </div>
      )}
      <div 
        className={classList}
        style={containerStyle}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={processedColumnDefs}
          gridOptions={mergedGridOptions}
        />
      </div>
    </div>
  );
}
