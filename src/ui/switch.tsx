'use client';

import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-checked:bg-primary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-background shadow-xs transition-transform data-[state=checked]:translate-x-4 motion-reduce:transition-none dark:bg-foreground dark:data-[state=checked]:bg-primary-foreground"
      />
    </SwitchPrimitive.Root>
  );
}
