'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useState,
} from 'react';

import {
  CommandDialog,
  CommandDialogContent,
  CommandDialogTrigger,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { SearchIcon } from './icons';
import { Kbd } from './kbd';
import { useShortcut } from './use-shortcut';

const ClosePaletteContext = createContext<(() => void) | null>(null);

function useClosePalette() {
  const close = use(ClosePaletteContext);
  if (!close) throw new Error('Palette items need a CommandPalette above');
  return close;
}

type CommandPaletteProps = {
  isApple: boolean;
  children: ReactNode;
};

export function CommandPalette({ isApple, children }: CommandPaletteProps) {
  const t = useTranslations('ui');
  const [open, setOpen] = useState(false);

  useShortcut('KeyK', (event) => {
    event.preventDefault();
    setOpen((current) => !current);
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogTrigger
        data-slot="command-palette-trigger"
        aria-keyshortcuts={isApple ? 'Meta+K' : 'Control+K'}
        className="flex items-center gap-2.5 rounded-md border px-2.25 py-1.25 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:size-4"
      >
        <SearchIcon />
        {t('search')}
        <Kbd aria-hidden className="ml-auto">
          {isApple ? '⌘K' : 'Ctrl K'}
        </Kbd>
      </CommandDialogTrigger>
      <CommandDialogContent title={t('commandPalette')}>
        <CommandInput placeholder={t('searchPlaceholder')} />
        <CommandList label={t('results')}>
          <CommandEmpty>{t('noResults')}</CommandEmpty>
          <ClosePaletteContext
            value={() => {
              setOpen(false);
            }}
          >
            {children}
          </ClosePaletteContext>
        </CommandList>
      </CommandDialogContent>
    </CommandDialog>
  );
}

type CommandPaletteItemProps = Omit<
  ComponentProps<typeof CommandItem>,
  'onSelect'
> & {
  onSelect: () => void;
};

export function CommandPaletteItem({
  onSelect,
  ...props
}: CommandPaletteItemProps) {
  const close = useClosePalette();

  return (
    <CommandItem
      onSelect={() => {
        close();
        onSelect();
      }}
      {...props}
    />
  );
}

type CommandPaletteLinkProps = {
  href: Route;
  children: ReactNode;
};

export function CommandPaletteLink({
  href,
  children,
}: CommandPaletteLinkProps) {
  const router = useRouter();

  return (
    <CommandPaletteItem
      onSelect={() => {
        router.push(href);
      }}
    >
      {children}
    </CommandPaletteItem>
  );
}
