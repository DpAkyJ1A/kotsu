import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  settingsDialogSection,
  type SettingsSection,
} from '../core/settings-sections';
import { dropSettingsDialog } from './settings-history';

export function useSettingsDialog() {
  const addressSection = settingsDialogSection(useSearchParams());
  const [isOpenedByAddress, setIsOpenedByAddress] = useState(
    addressSection !== null,
  );
  const [closingSection, setClosingSection] = useState<SettingsSection | null>(
    null,
  );
  if (addressSection === null && isOpenedByAddress) {
    setIsOpenedByAddress(false);
  }
  if (closingSection !== null && closingSection !== addressSection) {
    setClosingSection(null);
  }
  const section = addressSection === closingSection ? null : addressSection;

  function close() {
    if (section === null) return;
    setClosingSection(section);
    if (isOpenedByAddress) {
      setIsOpenedByAddress(false);
      dropSettingsDialog();
    } else {
      history.back();
    }
  }

  return { section, close };
}
