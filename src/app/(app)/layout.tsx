import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { AccountMenu, SessionRefresh } from '@/modules/account';
import { loadAccount } from '@/modules/account/loaders';
import { CalendarIcon, ClockIcon, GalleryVerticalEndIcon } from '@/ui/icons';
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
import { Toaster } from '@/ui/toast';
import { TooltipProvider } from '@/ui/tooltip';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const [account, cookieStore, t] = await Promise.all([
    loadAccount(),
    cookies(),
    getTranslations('nav'),
  ]);
  const sidebarState = sidebarStateFrom(cookieStore.get(SIDEBAR_COOKIE)?.value);

  return (
    <TooltipProvider>
      <SidebarProvider defaultState={sidebarState}>
        <Sidebar>
          <SidebarHeader>
            <AccountMenu account={account} />
            <SidebarTrigger />
          </SidebarHeader>
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
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
      <SessionRefresh />
      <Toaster />
    </TooltipProvider>
  );
}
