'use client';

import { cn } from 'cn';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ComponentProps,
  createContext,
  type PointerEvent,
  type ReactNode,
  use,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

import { isCurrentSection } from './current-section';
import { IconButton } from './icon-button';
import { PanelLeftIcon } from './icons';
import { Kbd } from './kbd';
import { sidebarCookie, type SidebarState } from './sidebar-cookie';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type SidebarContextValue = {
  state: SidebarState;
  canPeek: boolean;
  toggle: () => void;
  allowPeek: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const sidebar = use(SidebarContext);
  if (!sidebar) throw new Error('Sidebar parts need a SidebarProvider above');
  return sidebar;
}

type SidebarProviderProps = {
  defaultState: SidebarState;
  children: ReactNode;
};

export function SidebarProvider({
  defaultState,
  children,
}: SidebarProviderProps) {
  const [state, setState] = useState(defaultState);
  const [canPeek, setCanPeek] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function toggle() {
    const nextState = state === 'open' ? 'closed' : 'open';
    const triggerToFocus =
      wrapperRef.current && keyboardFocusTarget(wrapperRef.current, nextState);
    flushSync(() => {
      setState(nextState);
      setCanPeek(false);
    });
    document.cookie = sidebarCookie(nextState);
    triggerToFocus?.focus();
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!isToggleShortcut(event) || !isSidebarShown(wrapperRef.current)) {
      return;
    }
    event.preventDefault();
    toggle();
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);

  return (
    <SidebarContext
      value={{
        state,
        canPeek,
        toggle,
        allowPeek: () => {
          setCanPeek(true);
        },
      }}
    >
      <div
        ref={wrapperRef}
        data-slot="sidebar-wrapper"
        data-state={state}
        className="group/sidebar flex min-h-dvh max-md:flex-col"
      >
        {children}
      </div>
    </SidebarContext>
  );
}

function isToggleShortcut(event: KeyboardEvent) {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.code === 'Backslash' &&
    !event.repeat &&
    !event.defaultPrevented
  );
}

const SIDEBAR_SELECTOR = '[data-slot="sidebar"]';
const TRIGGER_SELECTOR = '[data-slot="sidebar-trigger"]';

function isSidebarShown(wrapper: HTMLElement | null) {
  const sidebar = wrapper?.querySelector(SIDEBAR_SELECTOR);
  return sidebar ? getComputedStyle(sidebar).display !== 'none' : false;
}

function keyboardFocusTarget(wrapper: HTMLElement, nextState: SidebarState) {
  const focused = document.activeElement;
  const sidebar = wrapper.querySelector(SIDEBAR_SELECTOR);
  if (!sidebar || !focused?.matches(':focus-visible')) return undefined;

  const triggers = Array.from(
    wrapper.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR),
  );
  const sidebarTrigger = triggers.find((trigger) => sidebar.contains(trigger));
  const pageTrigger = triggers.find((trigger) => !sidebar.contains(trigger));

  if (nextState === 'closed' && sidebar.contains(focused)) return pageTrigger;
  if (nextState === 'open' && focused === pageTrigger) return sidebarTrigger;
  return undefined;
}

export function Sidebar({
  className,
  children,
  ...props
}: ComponentProps<'aside'>) {
  const { state, canPeek, allowPeek } = useSidebar();

  function handleEdgePointer(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && isAtWindowEdge(event)) allowPeek();
  }

  return (
    <>
      <div
        data-slot="sidebar-gap"
        className="w-60 shrink-0 transition-[width] duration-200 ease-out group-data-[state=closed]/sidebar:w-0 motion-reduce:duration-0 max-md:hidden"
      />
      <aside
        data-slot="sidebar"
        data-state={state}
        data-peek={canPeek ? 'on' : 'off'}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col gap-4 border-r bg-sidebar p-3 text-sm text-sidebar-foreground transition-[translate,top,bottom,border-radius,box-shadow] duration-200 ease-out data-[peek=on]:inset-y-2 data-[peek=on]:rounded-r-2xl data-[peek=on]:border-y data-[peek=on]:shadow-xl data-[peek=on]:transition-[translate,box-shadow] motion-reduce:duration-0 max-md:hidden sidebar-hidden:invisible sidebar-hidden:-translate-x-full sidebar-hidden:shadow-none sidebar-hidden:transition-[translate,visibility,box-shadow]',
          className,
        )}
        {...props}
      >
        {children}
        {state === 'closed' && (
          <div
            data-slot="sidebar-edge"
            aria-hidden
            className="visible absolute inset-y-0 left-full w-2"
            onPointerMove={handleEdgePointer}
          />
        )}
      </aside>
    </>
  );
}

function isAtWindowEdge(event: PointerEvent<HTMLElement>) {
  return event.clientX < event.currentTarget.offsetWidth;
}

export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  );
}

export function SidebarNav({ children, ...props }: ComponentProps<'nav'>) {
  return (
    <nav data-slot="sidebar-nav" {...props}>
      <ul className="grid gap-px">{children}</ul>
    </nav>
  );
}

type SidebarLinkProps = {
  href: Route;
  children: ReactNode;
};

export function SidebarLink({ href, children }: SidebarLinkProps) {
  const pathname = usePathname();

  return (
    <li>
      <Link
        href={href}
        aria-current={isCurrentSection(pathname, href) ? 'page' : undefined}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:text-muted-foreground aria-[current=page]:[&>svg]:text-sidebar-primary"
      >
        {children}
      </Link>
    </li>
  );
}

export function SidebarTrigger() {
  const t = useTranslations('ui');
  const { state, toggle } = useSidebar();
  const label = state === 'open' ? t('closeSidebar') : t('openSidebar');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          data-slot="sidebar-trigger"
          label={label}
          size="sm"
          className="text-muted-foreground"
          onClick={toggle}
        >
          <PanelLeftIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent align="start">
        {label}
        <ToggleShortcut />
      </TooltipContent>
    </Tooltip>
  );
}

function ToggleShortcut() {
  const isApple = /Mac|iPhone|iPad/.test(navigator.userAgent);
  return <Kbd>{isApple ? '⌘\\' : 'Ctrl \\'}</Kbd>;
}

export function SidebarInset({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn('min-w-0 flex-1', className)}
      {...props}
    />
  );
}
