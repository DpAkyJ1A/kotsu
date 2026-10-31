'use client';

import { cn } from 'cn';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { DialogCloseButton, DialogOverlay } from './dialog';

// A drawer is a dialog that slides in from an edge, so it takes the dialog's parts and behaviour, and only its
// content differs. Not vaul, which shadcn/ui uses: it is no longer maintained. Being Radix like the rest, a Select
// inside the drawer shares its stack of layers, so Escape closes only the topmost
export {
  Dialog as Drawer,
  DialogClose as DrawerClose,
  DialogDescription as DrawerDescription,
  DialogFooter as DrawerFooter,
  DialogHeader as DrawerHeader,
  DialogTitle as DrawerTitle,
  DialogTrigger as DrawerTrigger,
} from './dialog';

// A bottom sheet on a phone, as tall as its content but leaving 4rem of the page above it, past which it scrolls;
// a full-height panel on the right from `md` up
export function DrawerContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100%-4rem)] flex-col gap-5 overflow-y-auto rounded-t-2xl bg-popover p-6 text-popover-foreground shadow-xl data-[state=closed]:animate-slide-out-bottom data-[state=open]:animate-slide-in-bottom',
          'md:inset-y-0 md:left-auto md:max-h-none md:w-sm md:rounded-none md:data-[state=closed]:animate-slide-out-right md:data-[state=open]:animate-slide-in-right',
          className,
        )}
        {...props}
      >
        {children}
        <DialogCloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
