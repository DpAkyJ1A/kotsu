import { isCurrentSection } from './current-section';

export function isCurrentTab(pathname: string, href: string) {
  return (
    isCurrentSection(pathname, href) ||
    (href === '/shelves' && isCurrentSection(pathname, '/docs'))
  );
}
