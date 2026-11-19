import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { REQUEST_PATH_HEADER } from '@/lib/sign-in-path';
import {
  AccountMenu,
  OpenSettingsCommand,
  SessionRefresh,
  SettingsDialog,
  ToggleThemeCommand,
} from '@/modules/account';
import {
  loadAccount,
  loadGoogleLink,
  loadSettings,
} from '@/modules/account/loaders';
import { onboardingPath } from '@/modules/onboarding';
import { isOnboarded } from '@/modules/onboarding/loaders';
import { ShelfNav, ShelvesProvider } from '@/modules/shelves';
import { loadShelves } from '@/modules/shelves/loaders';
import { CommandGroup } from '@/ui/command';
import { CommandPalette, CommandPaletteLink } from '@/ui/command-palette';
import {
  CalendarIcon,
  ClockIcon,
  GalleryVerticalEndIcon,
  LibraryIcon,
  SearchIcon,
} from '@/ui/icons';
import { isApplePlatform } from '@/ui/shortcut';
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
} from '@/ui/sidebar';
import { SIDEBAR_COOKIE, sidebarStateFrom } from '@/ui/sidebar-cookie';
import { TabBar, TabBarLink } from '@/ui/tab-bar';
import { Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  if (!(await isOnboarded())) {
    redirect(onboardingPath((await headers()).get(REQUEST_PATH_HEADER)));
  }

  const [account, settings, googleLink, shelves, cookieStore, headerStore, t] =
    await Promise.all([
      loadAccount(),
      loadSettings(),
      loadGoogleLink(),
      loadShelves(),
      cookies(),
      headers(),
      getTranslations('nav'),
    ]);
  const sidebarState = sidebarStateFrom(cookieStore.get(SIDEBAR_COOKIE)?.value);
  const isApple = isApplePlatform(headerStore.get('user-agent') ?? '');

  return (
    <TooltipProvider>
      <ShelvesProvider shelves={shelves}>
        <SidebarProvider defaultState={sidebarState}>
          <Sidebar>
            <SidebarHeader>
              <AccountMenu account={account} settings={settings} />
              <SidebarTrigger />
            </SidebarHeader>
            <CommandPalette isApple={isApple}>
              <CommandGroup heading={t('goTo')}>
                <CommandPaletteLink href="/calendar">
                  <CalendarIcon />
                  {t('calendar')}
                </CommandPaletteLink>
                <CommandPaletteLink href="/shelves">
                  <LibraryIcon />
                  {t('shelves')}
                </CommandPaletteLink>
                <CommandPaletteLink href="/practice">
                  <GalleryVerticalEndIcon />
                  {t('practice')}
                </CommandPaletteLink>
                <CommandPaletteLink href="/clock">
                  <ClockIcon />
                  {t('clock')}
                </CommandPaletteLink>
                <OpenSettingsCommand />
              </CommandGroup>
              <CommandGroup heading={t('actions')}>
                <ToggleThemeCommand />
              </CommandGroup>
            </CommandPalette>
            <SidebarNav>
              <SidebarLink href="/calendar">
                <CalendarIcon />
                {t('calendar')}
              </SidebarLink>
              <SidebarLink href="/practice">
                <GalleryVerticalEndIcon />
                {t('practice')}
              </SidebarLink>
              <SidebarLink href="/clock">
                <ClockIcon />
                {t('clock')}
              </SidebarLink>
            </SidebarNav>
            <ShelfNav />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
          <TabBar>
            <TabBarLink href="/calendar">
              <CalendarIcon />
              {t('calendar')}
            </TabBarLink>
            <TabBarLink href="/shelves">
              <LibraryIcon />
              {t('shelves')}
            </TabBarLink>
            <TabBarLink href="/practice">
              <GalleryVerticalEndIcon />
              {t('practice')}
            </TabBarLink>
            <TabBarLink href="/clock">
              <ClockIcon />
              {t('clock')}
            </TabBarLink>
            <TabBarLink href="/search">
              <SearchIcon />
              {t('search')}
            </TabBarLink>
          </TabBar>
        </SidebarProvider>
      </ShelvesProvider>
      <SettingsDialog
        account={account}
        settings={settings}
        googleLink={googleLink}
      />
      <SessionRefresh />
      <Toaster />
    </TooltipProvider>
  );
}
