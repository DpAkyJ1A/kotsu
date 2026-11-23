'use client';

import { cn } from 'cn';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

type SwatchGroupProps = Omit<
  ToggleGroupPrimitive.ToggleGroupSingleProps,
  'type'
>;

export function SwatchGroup({ className, ...props }: SwatchGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      data-slot="swatch-group"
      className={cn('flex gap-1', className)}
      {...props}
    />
  );
}

export function Swatch({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="swatch"
      className={cn(
        'grid size-7 place-items-center rounded-md border-2 border-transparent p-px hover:border-input focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-checked:border-foreground',
        className,
      )}
      {...props}
    />
  );
}
