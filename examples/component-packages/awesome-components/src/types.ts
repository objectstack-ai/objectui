export interface AwesomeTableProps {
  object: string;
  columns?: Array<{
    field: string;
    label?: string;
    width?: number;
    sortable?: boolean;
  }>;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onRowClick?: (row: any, index: number) => void;
}

export interface AwesomeFormProps {
  object: string;
  recordId?: string;
  mode?: 'create' | 'edit' | 'view';
  onSubmit?: (values: any) => void;
}
