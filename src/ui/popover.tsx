'use client';

import { cn } from 'cn';
import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger(
  props: ComponentProps<typeof PopoverPrimitive.Trigger>,
) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

// Opening moves the focus to the first control inside. The page stays usable: a click outside closes the
// popover, as Escape does, and Escape gives the focus back to the trigger. It needs an accessible name, an
// `aria-label` or a heading pointed at by `aria-labelledby`
export function PopoverContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl outline-hidden data-[state=open]:animate-fade-in',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
