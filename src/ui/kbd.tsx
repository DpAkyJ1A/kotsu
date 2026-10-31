import { cn } from 'cn';
import type { ComponentProps } from 'react';

// A key or a shortcut, `⌘K`. Inside a tooltip it takes the tooltip's inverted colours
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-muted px-1 font-sans text-xs font-semibold text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background',
        className,
      )}
      {...props}
    />
  );
}
