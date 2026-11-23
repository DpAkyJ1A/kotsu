'use client';

import { cn } from 'cn';
import { Toolbar as ToolbarPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { IconButton } from './icon-button';

export function Toolbar({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Root>) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn('flex flex-wrap items-center gap-0.5', className)}
      {...props}
    />
  );
}

export function ToolbarButton({
  className,
  disabled,
  ...props
}: ComponentProps<typeof IconButton>) {
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <IconButton
        data-slot="toolbar-button"
        size="sm"
        className={cn(
          'size-7 aria-pressed:bg-violet aria-pressed:text-violet-foreground',
          className,
        )}
        {...props}
      />
    </ToolbarPrimitive.Button>
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn('mx-1 h-5 w-px bg-border', className)}
      {...props}
    />
  );
}
