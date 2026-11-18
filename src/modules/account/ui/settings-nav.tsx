import { cn } from 'cn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { FingerprintPatternIcon, PaletteIcon, UserIcon } from '@/ui/icons';

import {
  settingsPagePath,
  type SettingsSection,
} from '../core/settings-sections';
import { SignOutButton } from './sign-out-button';

const SECTION_ICONS = {
  account: UserIcon,
  appearance: PaletteIcon,
  security: FingerprintPatternIcon,
} satisfies Record<SettingsSection, typeof UserIcon>;

const ITEM_CLASS_NAME =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current]:bg-sidebar-accent aria-[current]:font-semibold aria-[current]:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:text-muted-foreground aria-[current]:[&>svg]:text-sidebar-primary';

type SettingsNavProps = {
  heading: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SettingsNav({
  heading,
  className,
  children,
}: SettingsNavProps) {
  const t = useTranslations('settings');

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-3 bg-sidebar p-3 text-sm md:w-56',
        className,
      )}
    >
      {heading}
      <nav aria-label={t('title')}>
        <ul className="grid gap-px">{children}</ul>
      </nav>
      <SignOutButton
        className={cn(ITEM_CLASS_NAME, 'mt-auto text-muted-foreground')}
      />
    </div>
  );
}

type SettingsNavItemProps = {
  section: SettingsSection;
  isCurrent: boolean;
};

export function SettingsNavLink({ section, isCurrent }: SettingsNavItemProps) {
  return (
    <li>
      <Link
        href={settingsPagePath(section)}
        aria-current={isCurrent ? 'page' : undefined}
        className={ITEM_CLASS_NAME}
      >
        <SectionName section={section} />
      </Link>
    </li>
  );
}

export function SettingsNavButton({
  section,
  isCurrent,
  onClick,
}: SettingsNavItemProps & { onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-current={isCurrent ? 'true' : undefined}
        className={ITEM_CLASS_NAME}
        onClick={onClick}
      >
        <SectionName section={section} />
      </button>
    </li>
  );
}

function SectionName({ section }: { section: SettingsSection }) {
  const t = useTranslations('settings.sections');
  const Icon = SECTION_ICONS[section];

  return (
    <>
      <Icon />
      {t(`${section}.title`)}
    </>
  );
}
