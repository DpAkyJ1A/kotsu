'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { CheckIcon, ChevronRightIcon } from './icons';

// While the menu is open, arrows, Home / End and the first letters of an item move through it, Tab can't leave
// it, and Escape closes it and gives the focus back to the trigger
export function DropdownMenu(
  props: ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuTrigger(
  props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

const MENU_CLASS_NAME =
  'z-50 min-w-48 overflow-x-hidden overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl data-[state=open]:animate-fade-in';

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  collisionPadding = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          MENU_CLASS_NAME,
          'max-h-(--radix-dropdown-menu-content-available-height)',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

// What every row shares: an icon on the left takes the muted colour, as in the mockups
const ITEM_CLASS_NAME =
  'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&>svg]:text-muted-foreground';

const itemVariants = cva(ITEM_CLASS_NAME, {
  variants: {
    variant: {
      default: '',
      // Soft, as the destructive button: red text, a pink row under the pointer
      destructive:
        'text-red-foreground data-highlighted:bg-red data-highlighted:text-red-foreground [&>svg]:text-current',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function DropdownMenuItem({
  className,
  variant,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof itemVariants>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(itemVariants({ variant }), className)}
      {...props}
    />
  );
}

export function DropdownMenuRadioGroup(
  props: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

// The picked one has a tick on the right, as in Select
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(ITEM_CLASS_NAME, 'pr-8', className)}
      {...props}
    >
      {children}
      <span className="absolute right-2 flex items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuSegmentedGroup({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-segmented-group"
      className={cn(
        'my-1 grid auto-cols-fr grid-flow-col gap-0.5 rounded-md bg-muted p-0.5 dark:bg-background',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSegmentedItem({
  className,
  onSelect,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-segmented-item"
      onSelect={(event) => {
        event.preventDefault();
        onSelect?.(event);
      }}
      className={cn(
        'flex h-7 cursor-default items-center justify-center gap-1.5 rounded-sm px-2 text-xs font-medium whitespace-nowrap text-muted-foreground outline-hidden transition-colors select-none focus-visible:outline-2 focus-visible:outline-ring aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-xs data-highlighted:text-foreground dark:aria-checked:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSwatchGroup({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-swatch-group"
      className={cn('flex justify-between px-1.5 py-1', className)}
      {...props}
    />
  );
}

export function DropdownMenuSwatchItem({
  className,
  onSelect,
  ...props
}: Omit<ComponentProps<typeof DropdownMenuPrimitive.RadioItem>, 'children'>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-swatch-item"
      onSelect={(event) => {
        event.preventDefault();
        onSelect?.(event);
      }}
      className={cn(
        'grid size-5 cursor-default place-items-center rounded-full text-background outline-hidden transition-transform select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-highlighted:scale-115 motion-reduce:transition-none pointer-coarse:size-6',
        className,
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn(
        'px-2 py-1.5 text-xs font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
      {...props}
    />
  );
}

// The shortcut that does the same outside the menu, `⌘,`. Only shown: whoever owns the action binds the keys
export function DropdownMenuShortcut({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ml-auto text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

// A submenu opens on hover, on ArrowRight or Enter, and ArrowLeft closes it again
export function DropdownMenuSub(
  props: ComponentProps<typeof DropdownMenuPrimitive.Sub>,
) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        ITEM_CLASS_NAME,
        'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        className={cn(MENU_CLASS_NAME, className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
