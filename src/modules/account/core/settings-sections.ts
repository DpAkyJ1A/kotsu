export const SETTINGS_SECTIONS = [
  'account',
  'appearance',
  'security',
  'storage',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

const DIALOG_PARAM = 'settings';

type PageAddress = { pathname: string; search: string };

export function settingsSectionFrom(value: string | null | undefined) {
  return SETTINGS_SECTIONS.find((section) => section === value) ?? null;
}

export function settingsPagePath(section: SettingsSection) {
  return `/settings/${section}` as const;
}

export function settingsDialogSection(
  searchParams: Pick<URLSearchParams, 'get'>,
) {
  return settingsSectionFrom(searchParams.get(DIALOG_PARAM));
}

export function settingsDialogLink(pathname: string, section: SettingsSection) {
  return { pathname, query: { [DIALOG_PARAM]: section } };
}

export function settingsDialogHref(
  { pathname, search }: PageAddress,
  section: SettingsSection | null,
) {
  const params = new URLSearchParams(search);
  if (section) params.set(DIALOG_PARAM, section);
  else params.delete(DIALOG_PARAM);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
