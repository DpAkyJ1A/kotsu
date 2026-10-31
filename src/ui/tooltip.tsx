'use client';

import { cn } from 'cn';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

// Hovering waits this long before the first tooltip, so a pointer passing by opens nothing; while one is open,
// its neighbours open at once. Keyboard focus opens a tooltip without waiting
const OPEN_DELAY_MS = 400;

// One provider above all the tooltips, so they share that delay
export function TooltipProvider({
  delayDuration = OPEN_DELAY_MS,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export function Tooltip(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

export function TooltipTrigger(
  props: ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

// Only a tooltip that waited out the delay fades in: one opened by focus or right after a neighbour shows at
// once, and closing never waits for an animation
export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 flex w-fit max-w-xs items-center gap-1.5 rounded-sm bg-foreground px-2 py-1 text-xs font-medium text-balance text-background shadow-md data-[state=delayed-open]:animate-fade-in',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
