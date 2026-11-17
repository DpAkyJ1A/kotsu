export type SidebarState = 'open' | 'closed';

export const SIDEBAR_COOKIE = 'sidebar';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function sidebarStateFrom(cookie: string | undefined): SidebarState {
  return cookie === 'closed' ? 'closed' : 'open';
}

export function sidebarCookie(state: SidebarState) {
  return `${SIDEBAR_COOKIE}=${state}; path=/; max-age=${String(ONE_YEAR_IN_SECONDS)}; samesite=lax`;
}
