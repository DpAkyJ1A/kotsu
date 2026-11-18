import {
  settingsDialogHref,
  type SettingsSection,
} from '../core/settings-sections';

export function openSettingsDialog(section: SettingsSection) {
  history.pushState(null, '', settingsDialogHref(location, section));
}

export function showSettingsSection(section: SettingsSection) {
  history.replaceState(null, '', settingsDialogHref(location, section));
}

export function dropSettingsDialog() {
  history.replaceState(null, '', settingsDialogHref(location, null));
}
