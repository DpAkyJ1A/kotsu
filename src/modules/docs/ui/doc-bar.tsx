import type { ReactNode } from 'react';

import { PageHeader } from '@/ui/page-header';

type DocBarProps = { place: ReactNode; status: ReactNode; toolbar: ReactNode };

export function DocBar({ place, status, toolbar }: DocBarProps) {
  return (
    <div
      data-slot="doc-bar"
      className="z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center bg-background md:sticky md:top-0 md:border-b-on-scroll @6xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
    >
      <PageHeader className="@6xl:pr-4">{place}</PageHeader>
      <div className="col-span-2 mx-auto w-full max-w-2xl px-4 pb-2 max-md:hidden @6xl:col-span-1 @6xl:col-start-2 @6xl:row-start-1 @6xl:w-2xl @6xl:pb-0">
        {toolbar}
      </div>
      <div className="col-start-2 row-start-1 flex justify-end pr-6 @6xl:col-start-3">
        {status}
      </div>
    </div>
  );
}
