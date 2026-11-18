import 'server-only';

import type { UserSettings } from '@/server/settings';

import type { Settings } from '../core/settings';

export function toSettingsDto(settings: UserSettings): Settings {
  return {
    theme: settings.theme,
    locale: settings.locale,
    dayEndsAt: settings.dayEndsAt.slice(0, 5),
    weekStart: settings.weekStart,
    timeFormat: settings.timeFormat,
  };
}
