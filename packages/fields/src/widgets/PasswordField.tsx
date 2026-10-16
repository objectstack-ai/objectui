import React, { useState } from 'react';
import { Input, EmptyValue } from '@object-ui/components';
import { Button } from '@object-ui/components';
import { isEmptyValue } from '@object-ui/core';
import { Eye, EyeOff } from 'lucide-react';
import { coerceToSafeValue } from '../coerceToSafeValue.js';
import { FieldWidgetComponentProps } from './types.js';
import { toDomProps } from './toDomProps.js';

/**
 * PasswordField - Secure password input with visibility toggle
 * Includes show/hide toggle button and masks value in readonly mode
 *
 * Readonly draws the mask for a credential that is SET, and the shared
 * `EmptyValue` affordance for one that is NOT (objectui#10639). The platform's
 * read contract is presence-preserving: `@objectstack/spec`'s `SECRET_MASK`
 * docblock says an unset credential "reads back `null` instead, never this
 * mask", which is what lets a reader tell "configured" from "not configured".
 *
 * "Empty" is the password CELL's predicate (`MaskedCellRenderer` in this
 * package's barrel, objectui#8678), called on the same two helpers, so `{}`
 * and a whitespace-only string stay values and keep the mask. The helpers are
 * imported from their own modules, never from the barrel, which lazy-loads
 * this widget. ⛔ The value is never printed, and a set value keeps exactly
 * the mask it drew before. `__tests__/PasswordField.readonlyEmpty-10639`
 * pins the widget's "empty" to the cell's.
 */
export function PasswordField({ value, onChange, field, readonly, className, ...props }: FieldWidgetComponentProps<string>) {
  const [showPassword, setShowPassword] = useState(false);
  const config = field;

  if (readonly) {
    if (isEmptyValue(coerceToSafeValue(value))) return <EmptyValue />;
    return <span className="text-sm">••••••••</span>;
  }

  const domProps = toDomProps(props);

  return (
    <div className="relative">
      <Input
        {...domProps}
        type={showPassword ? 'text' : 'password'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config?.placeholder}
        disabled={readonly || domProps.disabled}
        className={`pr-10 ${className || ''}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="size-4 text-gray-500" />
        ) : (
          <Eye className="size-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
}
