'use client';

import { cn } from 'cn';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { isCurrentSection } from './current-section';

export function TabBar({
  className,
  children,
  ...props
}: ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="tab-bar"
      className={cn(
        'sticky bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden',
        className,
      )}
      {...props}
    >
      <ul className="grid auto-cols-fr grid-flow-col">{children}</ul>
    </nav>
  );
}

type TabBarLinkProps = {
  href: Route;
  children: ReactNode;
};

export function TabBarLink({ href, children }: TabBarLinkProps) {
  const pathname = usePathname();

  return (
    <li>
      <Link
        href={href}
        aria-current={isCurrentSection(pathname, href) ? 'page' : undefined}
        className="flex h-tab-bar flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-primary [&>svg]:size-6"
      >
        {children}
      </Link>
    </li>
  );
}
