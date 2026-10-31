'use client';

import { cn } from 'cn';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { CheckIcon } from './icons';

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer grid size-4.5 shrink-0 place-content-center rounded-xs border border-input text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground',
        'aria-invalid:border-destructive aria-invalid:bg-red aria-invalid:focus-visible:outline-destructive aria-invalid:aria-checked:bg-destructive',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
