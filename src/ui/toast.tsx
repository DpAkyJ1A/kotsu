'use client';

import { cn } from 'cn';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { CheckIcon, XIcon } from './icons';

// `toast('Saved')`, `toast.success('Got it · la cocina', { action: { label: 'Undo', onClick } })`. It works
// anywhere once a <Toaster> is on the page
export { toast } from 'sonner';

const ICON_CLASS_NAME = 'size-4 rounded-full p-0.5 text-background';

// Sonner's toasts in Kotsu's colours: inverted, like a tooltip, on screen for 5 s, and paused while the pointer
// or the focus is on them. An error is red in both themes, like the destructive button: inverted, it would be
// white in the dark one. Alt+T moves the focus to them, so Undo can be reached from the keyboard
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      duration={5000}
      icons={{
        success: (
          <CheckIcon className={cn(ICON_CLASS_NAME, 'bg-green-foreground')} />
        ),
        error: <XIcon className={cn(ICON_CLASS_NAME, 'bg-destructive')} />,
      }}
      toastOptions={{
        // Sonner keeps positioning and stacking its toasts; everything they look like comes from here
        unstyled: true,
        classNames: {
          // Sonner's own stylesheet, outside any layer, resets a toast's outline, so the focus ring needs `!`
          toast:
            'group/toast flex w-full items-center gap-2.5 rounded-lg bg-foreground px-3 py-2.5 font-sans text-sm font-medium text-background shadow-lg focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring! data-[type=error]:bg-red data-[type=error]:text-red-foreground',
          icon: 'flex shrink-0',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          // Dimmed, the red text would fall below 4.5:1 on an error toast in either theme
          description:
            'text-xs font-normal text-background/70 group-data-[type=error]/toast:text-current',
          actionButton:
            '-my-1 shrink-0 rounded-sm px-2 py-1 font-bold transition-colors hover:bg-current/15 focus-visible:outline-2 focus-visible:outline-ring',
        },
      }}
      {...props}
    />
  );
}
