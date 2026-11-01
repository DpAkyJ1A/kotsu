'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { IconButton } from './icon-button';
import { XIcon } from './icons';

// While a dialog is open, the focus stays inside and the rest of the page is hidden from screen readers. Escape,
// the close button or a click on the overlay closes it, and the focus goes back to the trigger
export function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

export function DialogTrigger(
  props: ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogClose(
  props: ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

// The overlay and the close button are shared with DrawerContent
export function DialogOverlay() {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
    />
  );
}

// It sits in the corner but comes last in the tab order, so the focus starts on the content
export function DialogCloseButton() {
  const t = useTranslations('ui');

  return (
    <DialogPrimitive.Close asChild>
      <IconButton
        label={t('close')}
        size="sm"
        className="absolute top-3 right-3 text-muted-foreground"
      >
        <XIcon />
      </IconButton>
    </DialogPrimitive.Close>
  );
}

// Centred by `inset-4 m-auto`: as wide as the screen allows up to `max-w-md`, and as tall as its content up to
// the screen less that inset, past which it scrolls
export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed inset-4 z-50 m-auto flex h-fit max-h-[calc(100%-2rem)] max-w-md flex-col gap-5 overflow-y-auto rounded-2xl bg-popover p-6 text-popover-foreground shadow-xl data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
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

// Leaves room on the right for the close button
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1.5 pr-8', className)}
      {...props}
    />
  );
}

// The main action goes last: it sits on the right, or on top when the buttons stack on a phone
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-tight font-bold', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
