/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - Field Type Definitions
 * 
 * Comprehensive field type system for ObjectQL protocol.
 * Defines all field types supported in ObjectTable and ObjectForm components.
 * 
 * @module field-types
 * @packageDocumentation
 */

/**
 * Base field metadata interface
 * Common properties shared by all field types
 */
export interface BaseFieldMetadata {
  /**
   * Field name/identifier
   */
  name: string;
  
  /**
   * Display label
   */
  label?: string;
  
  /**
   * Field type identifier
   */
  type: string;
  
  /**
   * Help text or description
   */
  help?: string;
  
  /**
   * Description text
   */
  description?: string;
  
  /**
   * Whether field is required
   */
  required?: boolean;
  
  /**
   * Whether field is read-only
   */
  readonly?: boolean;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Default value
   */
  defaultValue?: any;
  
  /**
   * Field permissions
   */
  permissions?: {
    read?: boolean;
    write?: boolean;
  };
  
  /**
   * Whether field is sortable
   */
  sortable?: boolean;
  
  /**
   * Whether field is filterable
   */
  filterable?: boolean;
  
  /**
   * Conditional visibility expression
   */
  visible_on?: VisibilityCondition;
  
  /**
   * Custom validation function or rules
   */
  validate?: ValidationFunction | ValidationRule;
}

/**
 * Visibility condition type
 */
export type VisibilityCondition = {
  field: string;
  operator?: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in';
  value?: any;
  and?: VisibilityCondition[];
  or?: VisibilityCondition[];
};

/**
 * Validation function type
 */
export type ValidationFunction = (value: any) => boolean | string | Promise<boolean | string>;

/**
 * Validation rule type
 */
export type ValidationRule = {
  required?: boolean | string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  custom?: ValidationFunction;
};

/**
 * Text field metadata
 */
export interface TextFieldMetadata extends BaseFieldMetadata {
  type: 'text';
  min_length?: number;
  max_length?: number;
  pattern?: string | RegExp;
  pattern_message?: string;
}

/**
 * Long text/textarea field metadata
 */
export interface TextareaFieldMetadata extends BaseFieldMetadata {
  type: 'textarea';
  min_length?: number;
  max_length?: number;
  rows?: number;
}

/**
 * Markdown field metadata
 */
export interface MarkdownFieldMetadata extends BaseFieldMetadata {
  type: 'markdown';
  max_length?: number;
}

/**
 * HTML/Rich text field metadata
 */
export interface HtmlFieldMetadata extends BaseFieldMetadata {
  type: 'html';
  max_length?: number;
}

/**
 * Number field metadata
 */
export interface NumberFieldMetadata extends BaseFieldMetadata {
  type: 'number';
  min?: number;
  max?: number;
  precision?: number;
  step?: number;
}

/**
 * Currency field metadata
 */
export interface CurrencyFieldMetadata extends BaseFieldMetadata {
  type: 'currency';
  currency?: string;
  precision?: number;
  min?: number;
  max?: number;
}

/**
 * Percent field metadata
 */
export interface PercentFieldMetadata extends BaseFieldMetadata {
  type: 'percent';
  precision?: number;
  min?: number;
  max?: number;
}

/**
 * Boolean field metadata
 */
export interface BooleanFieldMetadata extends BaseFieldMetadata {
  type: 'boolean';
}

/**
 * Date field metadata
 */
export interface DateFieldMetadata extends BaseFieldMetadata {
  type: 'date';
  format?: string;
  min_date?: string | Date;
  max_date?: string | Date;
}

/**
 * DateTime field metadata
 */
export interface DateTimeFieldMetadata extends BaseFieldMetadata {
  type: 'datetime';
  format?: string;
  min_date?: string | Date;
  max_date?: string | Date;
}

/**
 * Time field metadata
 */
export interface TimeFieldMetadata extends BaseFieldMetadata {
  type: 'time';
  format?: string;
}

/**
 * Select option
 */
export interface SelectOptionMetadata {
  label: string;
  value: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * Select field metadata
 */
export interface SelectFieldMetadata extends BaseFieldMetadata {
  type: 'select';
  options?: SelectOptionMetadata[];
  multiple?: boolean;
  searchable?: boolean;
}

/**
 * Email field metadata
 */
export interface EmailFieldMetadata extends BaseFieldMetadata {
  type: 'email';
  max_length?: number;
}

/**
 * Phone field metadata
 */
export interface PhoneFieldMetadata extends BaseFieldMetadata {
  type: 'phone';
  format?: string;
}

/**
 * URL field metadata
 */
export interface UrlFieldMetadata extends BaseFieldMetadata {
  type: 'url';
  max_length?: number;
}

/**
 * Password field metadata
 */
export interface PasswordFieldMetadata extends BaseFieldMetadata {
  type: 'password';
  min_length?: number;
  max_length?: number;
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  original_name?: string;
  size?: number;
  mime_type?: string;
  url?: string;
}

/**
 * File field metadata
 */
export interface FileFieldMetadata extends BaseFieldMetadata {
  type: 'file';
  multiple?: boolean;
  accept?: string[];
  max_size?: number;
  max_files?: number;
}

/**
 * Image field metadata
 */
export interface ImageFieldMetadata extends BaseFieldMetadata {
  type: 'image';
  multiple?: boolean;
  accept?: string[];
  max_size?: number;
  max_files?: number;
  max_width?: number;
  max_height?: number;
}

/**
 * Location field metadata
 */
export interface LocationFieldMetadata extends BaseFieldMetadata {
  type: 'location';
  default_zoom?: number;
}

/**
 * Lookup/Master-Detail field metadata
 */
export interface LookupFieldMetadata extends BaseFieldMetadata {
  type: 'lookup' | 'master_detail';
  reference_to?: string;
  reference_field?: string;
  multiple?: boolean;
  searchable?: boolean;
  options?: SelectOptionMetadata[];
}

/**
 * Formula field metadata (read-only computed field)
 */
export interface FormulaFieldMetadata extends BaseFieldMetadata {
  type: 'formula';
  formula?: string;
  return_type?: string;
}

/**
 * Summary/Rollup field metadata (aggregation)
 */
export interface SummaryFieldMetadata extends BaseFieldMetadata {
  type: 'summary';
  summary_object?: string;
  summary_field?: string;
  summary_type?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

/**
 * Auto-number field metadata
 */
export interface AutoNumberFieldMetadata extends BaseFieldMetadata {
  type: 'auto_number';
  format?: string;
  starting_number?: number;
}

/**
 * User/Owner field metadata
 */
export interface UserFieldMetadata extends BaseFieldMetadata {
  type: 'user' | 'owner';
  multiple?: boolean;
}

/**
 * Object field metadata (JSON object)
 */
export interface ObjectFieldMetadata extends BaseFieldMetadata {
  type: 'object';
  schema?: Record<string, any>;
}

/**
 * Vector field metadata (embeddings)
 */
export interface VectorFieldMetadata extends BaseFieldMetadata {
  type: 'vector';
  dimensions?: number;
}

/**
 * Grid field metadata (sub-table)
 */
export interface GridFieldMetadata extends BaseFieldMetadata {
  type: 'grid';
  columns?: any[];
}

export interface ColorFieldMetadata extends BaseFieldMetadata {
  type: 'color';
}

export interface CodeFieldMetadata extends BaseFieldMetadata {
  type: 'code';
}

export interface AvatarFieldMetadata extends BaseFieldMetadata {
  type: 'avatar';
}

export interface SignatureFieldMetadata extends BaseFieldMetadata {
  type: 'signature';
}

export interface QRCodeFieldMetadata extends BaseFieldMetadata {
  type: 'qrcode';
}

export interface AddressFieldMetadata extends BaseFieldMetadata {
  type: 'address';
}

export interface GeolocationFieldMetadata extends BaseFieldMetadata {
  type: 'geolocation';
}

export interface SliderFieldMetadata extends BaseFieldMetadata {
  type: 'slider';
  min?: number;
  max?: number;
}

export interface RatingFieldMetadata extends BaseFieldMetadata {
  type: 'rating';
  max?: number;
}

export interface MasterDetailFieldMetadata extends BaseFieldMetadata {
  type: 'master_detail';
  reference_to?: string;
}

/**
 * Union type of all field metadata types
 */
export type FieldMetadata =
  | TextFieldMetadata
  | TextareaFieldMetadata
  | MarkdownFieldMetadata
  | HtmlFieldMetadata
  | NumberFieldMetadata
  | CurrencyFieldMetadata
  | PercentFieldMetadata
  | BooleanFieldMetadata
  | DateFieldMetadata
  | DateTimeFieldMetadata
  | TimeFieldMetadata
  | SelectFieldMetadata
  | EmailFieldMetadata
  | PhoneFieldMetadata
  | UrlFieldMetadata
  | PasswordFieldMetadata
  | FileFieldMetadata
  | ImageFieldMetadata
  | LocationFieldMetadata
  | LookupFieldMetadata
  | FormulaFieldMetadata
  | SummaryFieldMetadata
  | AutoNumberFieldMetadata
  | UserFieldMetadata
  | ObjectFieldMetadata
  | VectorFieldMetadata
  | GridFieldMetadata
  | ColorFieldMetadata
  | CodeFieldMetadata
  | AvatarFieldMetadata
  | SignatureFieldMetadata
  | QRCodeFieldMetadata
  | AddressFieldMetadata
  | GeolocationFieldMetadata
  | SliderFieldMetadata
  | RatingFieldMetadata
  | MasterDetailFieldMetadata;

/**
 * Object schema definition
 */
export interface ObjectSchemaMetadata {
  /**
   * Object name
   */
  name: string;
  
  /**
   * Display label
   */
  label?: string;
  
  /**
   * Object description
   */
  description?: string;
  
  /**
   * Fields definition
   */
  fields: Record<string, FieldMetadata>;
  
  /**
   * Permissions
   */
  permissions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}
