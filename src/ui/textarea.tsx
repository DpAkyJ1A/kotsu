import { cn } from 'cn';
import type { ComponentProps } from 'react';

import { FIELD_CLASS_NAME } from './field';

// Grows with its text (field-sizing), from two lines up
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        FIELD_CLASS_NAME,
        'field-sizing-content min-h-16 py-2',
        className,
      )}
      {...props}
    />
  );
}
