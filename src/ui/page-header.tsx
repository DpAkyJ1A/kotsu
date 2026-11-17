import { cn } from 'cn';
import type { ComponentProps } from 'react';

import { SidebarTrigger } from './sidebar';

export function PageHeader({
  className,
  children,
  ...props
}: ComponentProps<'header'>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex h-14 items-center gap-3 px-6 will-change-transform',
        className,
      )}
      {...props}
    >
      <div className="flex w-8 shrink-0 justify-end transition-[width,margin,opacity] duration-200 ease-out group-data-[state=open]/sidebar:invisible group-data-[state=open]/sidebar:-mr-3 group-data-[state=open]/sidebar:w-0 group-data-[state=open]/sidebar:opacity-0 group-data-[state=open]/sidebar:transition-[width,margin,opacity,visibility] motion-reduce:duration-0 max-md:hidden">
        <SidebarTrigger />
      </div>
      {children}
    </header>
  );
}
