import { cn } from 'cn';
import type { ComponentProps } from 'react';

import { FIELD_CLASS_NAME } from './field';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(FIELD_CLASS_NAME, 'h-9', className)}
      {...props}
    />
  );
}
