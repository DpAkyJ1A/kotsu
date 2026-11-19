import type { Account } from '../core/account';
import type { GoogleLink } from '../core/google-link';
import type { Settings } from '../core/settings';
import type { SettingsSection } from '../core/settings-sections';
import { AccountSection } from './account-section';
import { AppearanceSection } from './appearance-section';
import { GoogleLinkSettings } from './google-link-settings';
import { PasskeysSettings } from './passkeys-settings';

type SettingsSectionContentProps = {
  section: SettingsSection;
  account: Account;
  settings: Settings;
  googleLink: GoogleLink;
};

export function SettingsSectionContent({
  section,
  account,
  settings,
  googleLink,
}: SettingsSectionContentProps) {
  switch (section) {
    case 'account':
      return <AccountSection account={account} />;
    case 'appearance':
      return <AppearanceSection settings={settings} />;
    case 'security':
      return (
        <div className="grid gap-8">
          <PasskeysSettings email={account.email} />
          {googleLink.status !== 'off' && (
            <GoogleLinkSettings email={account.email} link={googleLink} />
          )}
        </div>
      );
  }
}
