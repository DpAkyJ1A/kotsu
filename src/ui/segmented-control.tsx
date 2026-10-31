'use client';

import { cn } from 'cn';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

// A radio group drawn as one track: one value is always picked, arrow keys move the pick, and a screen
// reader hears "Week, 2 of 3". Segments share the width equally
export function SegmentedControl({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      className={cn(
        'inline-grid auto-cols-fr grid-flow-col gap-0.5 rounded-md bg-muted p-0.5',
        className,
      )}
      {...props}
    />
  );
}

export function SegmentedControlItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded-sm px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-xs dark:aria-checked:bg-muted',
        className,
      )}
      {...props}
    />
  );
}
