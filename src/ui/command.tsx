'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { cn } from 'cn';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { type ComponentProps, useRef } from 'react';

import { DialogOverlay } from './dialog';
import { SearchIcon } from './icons';

// The ⌘K palette is a dialog with a search field over a list that filters as you type, so it takes the dialog's
// root and trigger, and only its content differs. The list is cmdk, as in shadcn/ui: the focus stays in the
// field, arrows and Home / End move the highlight, Enter runs the highlighted item
export {
  Dialog as CommandDialog,
  DialogTrigger as CommandDialogTrigger,
} from './dialog';

type CommandDialogContentProps = ComponentProps<
  typeof DialogPrimitive.Content
> & {
  // Not shown: the name a screen reader gives the dialog and the search field
  title: string;
};

// Pinned near the top, so the field stays put while the list shrinks under it. It opens with a fade and closes at
// once, as a menu does, so the page is there the moment an item runs. ⌘K can open it from anywhere: closing gives
// the focus back to wherever it was, or to the trigger as other dialogs do
export function CommandDialogContent({
  title,
  className,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: CommandDialogContentProps) {
  const returnFocusTo = useRef<HTMLElement>(null);

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="command-dialog-content"
        aria-describedby={undefined}
        className={cn(
          'fixed inset-x-4 top-[12vh] z-50 mx-auto flex max-h-[76vh] max-w-xl flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-xl outline-hidden data-[state=open]:animate-fade-in',
          className,
        )}
        onOpenAutoFocus={(event) => {
          // Radix moves the focus into the dialog after this event, so the page still has it here
          const { activeElement } = document;
          returnFocusTo.current =
            activeElement instanceof HTMLElement &&
            activeElement !== document.body
              ? activeElement
              : null;
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (event.defaultPrevented || !returnFocusTo.current?.isConnected) {
            return;
          }
          event.preventDefault();
          returnFocusTo.current.focus();
        }}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">
          {title}
        </DialogPrimitive.Title>
        <CommandPrimitive
          data-slot="command"
          label={title}
          className="flex min-h-0 flex-col"
        >
          {children}
        </CommandPrimitive>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

// Text is 16px everywhere: iOS zooms into a focused field with smaller text, and a palette field reads better big
export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex shrink-0 items-center gap-2.5 border-b px-4"
    >
      <SearchIcon className="shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'h-12 w-full min-w-0 bg-transparent text-base outline-hidden placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    </div>
  );
}

type CommandListProps = Omit<
  ComponentProps<typeof CommandPrimitive.List>,
  'label'
> & {
  // The accessible name of the list, required: cmdk's own is the English "Suggestions"
  label: string;
};

export function CommandList({ className, ...props }: CommandListProps) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-96 min-h-0 scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5',
        className,
      )}
      {...props}
    />
  );
}

// Shown only while the search matches nothing
export function CommandEmpty({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        'py-8 text-center text-sm text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

// Hidden while none of its items match; the heading is styled as a menu label. The headings are what divides the
// groups: cmdk's separator has `role="separator"`, which a listbox may not hold, so the kit has none
export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

// A row of DropdownMenu, a step taller. cmdk searches the text of the row unless it has a `value`, and rows with
// the same value highlight together, so rows that may share a text need their own value
export function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden select-none aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground [&>svg]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

// The shortcut that does the same outside the palette, `⌘,`. Only shown: whoever owns the action binds the keys
export function CommandShortcut({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
