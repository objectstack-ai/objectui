import React from 'react';
import { Input } from '@object-ui/components';
import { FieldWidgetProps } from './types';

export function LocationField({ value, onChange, field, readonly, ...props }: FieldWidgetProps<any>) {
  // Location can be stored as { latitude, longitude } or as a string
  const displayValue = typeof value === 'object' 
    ? `${value?.latitude || 0}, ${value?.longitude || 0}`
    : value || '';

  if (readonly) {
    return <span className="text-sm">{displayValue || '-'}</span>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Try to parse as coordinates (latitude, longitude)
    const parts = val.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onChange({ latitude: lat, longitude: lng });
        return;
      }
    }
    // Otherwise store as string
    onChange(val);
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={field.placeholder || 'latitude, longitude'}
      disabled={readonly}
      className={props.className}
    />
  );
}
