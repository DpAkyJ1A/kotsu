import { cn } from 'cn';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { type Account, displayName } from '../core/account';
import { Avatar } from './avatar';

type SettingsAvatarLinkProps = { account: Account; className?: string };

export function SettingsAvatarLink({
  account,
  className,
}: SettingsAvatarLinkProps) {
  const t = useTranslations('settings');

  return (
    <Link
      href="/settings"
      aria-label={t('title')}
      className={cn(
        '-mr-1 rounded-full p-1 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Avatar name={displayName(account)} size="lg" />
    </Link>
  );
}
