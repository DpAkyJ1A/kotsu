export const COLLAPSED_SHELVES_COOKIE = 'collapsed-shelves';

const SEPARATOR = '.';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function collapsedShelvesFrom(cookie: string | undefined) {
  return cookie?.split(SEPARATOR).filter(Boolean) ?? [];
}

export function collapsedShelvesCookie(
  shelves: readonly { id: string }[],
  collapsed: ReadonlySet<string>,
) {
  const value = shelves
    .map(({ id }) => id)
    .filter((id) => collapsed.has(id))
    .join(SEPARATOR);
  return `${COLLAPSED_SHELVES_COOKIE}=${value}; path=/; max-age=${String(ONE_YEAR_IN_SECONDS)}; samesite=lax`;
}
