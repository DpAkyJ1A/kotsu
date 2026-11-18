import type { Account } from '../core/account';
import type { Settings } from '../core/settings';
import type { SettingsSection } from '../core/settings-sections';
import { AccountSection } from './account-section';
import { AppearanceSection } from './appearance-section';
import { PasskeysSettings } from './passkeys-settings';

type SettingsSectionContentProps = {
  section: SettingsSection;
  account: Account;
  settings: Settings;
};

export function SettingsSectionContent({
  section,
  account,
  settings,
}: SettingsSectionContentProps) {
  switch (section) {
    case 'account':
      return <AccountSection account={account} />;
    case 'appearance':
      return <AppearanceSection settings={settings} />;
    case 'security':
      return <PasskeysSettings email={account.email} />;
  }
}
