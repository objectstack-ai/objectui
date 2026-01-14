import { ComponentRegistry } from '@object-ui/core';
import type { InputOTPSchema } from '@object-ui/types';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/ui';

ComponentRegistry.register('input-otp', 
  ({ schema, className, ...props }: { schema: InputOTPSchema; className?: string; [key: string]: any }) => (
    <InputOTP maxLength={schema.length || 6} className={className} {...props}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
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
