import { ComponentRegistry } from '@object-ui/core';
import type { InputOTPSchema } from '@object-ui/types';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '../../ui';

ComponentRegistry.register('input-otp', 
  ({ schema, className, onChange, value, ...props }: { schema: InputOTPSchema; className?: string; [key: string]: any }) => {
    const length = schema.maxLength || 6;
    const slots = Array.from({ length });

    const handleChange = (val: string) => {
      if (onChange) {
        onChange(val);
      }
    };

    return (
      <InputOTP 
        maxLength={length} 
        className={className} 
        value={value ?? schema.value}
        onChange={handleChange}
        {...props}
      >
        <InputOTPGroup>
          {slots.map((_, i) => (
             <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    );
  },
  {
    label: 'Input OTP',
    inputs: [
      { name: 'maxLength', type: 'number', label: 'Max Length', defaultValue: 6 },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      maxLength: 6
    }
  }
);
