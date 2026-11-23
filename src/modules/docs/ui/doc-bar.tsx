import type { ReactNode } from 'react';

import { PageHeader } from '@/ui/page-header';

type DocBarProps = {
  place: ReactNode;
  status: ReactNode;
  toolbar: ReactNode;
  outline: ReactNode;
};

export function DocBar({ place, status, toolbar, outline }: DocBarProps) {
  return (
    <div
      data-slot="doc-bar"
      className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center bg-background md:sticky md:top-0 md:border-b-on-scroll @6xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
    >
      <PageHeader className="@6xl:pr-4">{place}</PageHeader>
      <div className="col-span-2 mx-auto w-full max-w-2xl px-4 pb-2 max-md:hidden @6xl:col-span-1 @6xl:col-start-2 @6xl:row-start-1 @6xl:w-2xl @6xl:pb-0">
        {toolbar}
      </div>
      <div className="col-start-2 row-start-1 flex justify-end pr-6 @6xl:col-start-3">
        {status}
      </div>
      <div className="absolute top-full right-0 col-start-2 row-start-2 @max-3xl:hidden @6xl:left-0 @6xl:col-start-3 @6xl:row-start-1">
        {outline}
      </div>
    </div>
  );
}
