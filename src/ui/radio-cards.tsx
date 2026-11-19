'use client';

import { cn } from 'cn';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';

export function RadioCards({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-cards"
      className={cn('grid auto-cols-fr grid-flow-col gap-3', className)}
      {...props}
    />
  );
}

type RadioCardProps = ComponentProps<typeof RadioGroupPrimitive.Item> & {
  picture: ReactNode;
};

export function RadioCard({
  picture,
  className,
  children,
  ...props
}: RadioCardProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        'group grid min-w-0 gap-2 rounded-lg text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="radio-card-picture"
        className="block aspect-video overflow-hidden rounded-lg border-2 transition-colors group-hover:border-input group-aria-checked:border-primary"
      >
        {picture}
      </span>
      <span className="flex items-center gap-2">
        <span className="size-4 shrink-0 rounded-full border-2 border-input transition-[border] group-aria-checked:border-5 group-aria-checked:border-primary" />
        {children}
      </span>
    </RadioGroupPrimitive.Item>
  );
}
