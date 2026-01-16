import { ComponentRegistry } from '@object-ui/core';
import type { SelectSchema } from '@object-ui/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label
} from '../../ui';

ComponentRegistry.register('select', 
  ({ schema, className, ...props }: { schema: SelectSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...selectProps 
    } = props;

    return (
    <div 
        className={`grid w-full max-w-sm items-center gap-1.5 ${schema.wrapperClass || ''}`}
        data-obj-id={dataObjId}
        data-obj-type={dataObjType}
        style={style}
    >
      {schema.label && <Label>{schema.label}</Label>}
      <Select defaultValue={schema.defaultValue} {...selectProps}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={schema.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {schema.options?.map((opt) => (
             <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  },
  {
    label: 'Select',
    inputs: [
      { name: 'label', type: 'string', label: 'Label' },
      { name: 'placeholder', type: 'string', label: 'Placeholder' },
      { name: 'defaultValue', type: 'string', label: 'Default Value' },
      { 
        name: 'options', 
        type: 'array', 
        label: 'Options',
        description: 'Array of {label, value} objects'
      }
    ],
    defaultProps: {
      label: 'Select an option',
      placeholder: 'Choose...',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ]
    }
  }
);
