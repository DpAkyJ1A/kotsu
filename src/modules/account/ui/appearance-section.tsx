'use client';

import {
  hasLocale,
  type Locale,
  useFormatter,
  useTranslations,
} from 'next-intl';

import {
  LOCALES,
  TIME_FORMATS,
  type TimeFormat,
  WEEK_STARTS,
  type WeekStart,
} from '@/lib/user-settings';
import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';

import { LANGUAGE_NAMES } from '../core/language-names';
import {
  DAY_END_TIMES,
  type DayEndTime,
  type Settings,
} from '../core/settings';
import { useOptimisticSetting } from '../hooks/use-optimistic-setting';
import { SettingsField } from './settings-field';
import { ThemeCards } from './theme-cards';

type AppearanceSectionProps = { settings: Settings };

export function AppearanceSection({ settings }: AppearanceSectionProps) {
  return (
    <div className="grid gap-4">
      <ThemeCards theme={settings.theme} />
      <div>
        <LanguageField locale={settings.locale} />
        <DayEndField dayEndsAt={settings.dayEndsAt} />
        <WeekStartField weekStart={settings.weekStart} />
        <TimeFormatField timeFormat={settings.timeFormat} />
      </div>
    </div>
  );
}

function LanguageField({ locale }: { locale: Locale }) {
  const t = useTranslations('settings');
  const language = useOptimisticSetting(locale, (picked) => ({
    locale: picked,
  }));

  return (
    <SettingsField label={t('language')} description={t('languageDescription')}>
      {(labels) => (
        <Select
          value={language.shown}
          onValueChange={(value) => {
            if (hasLocale(LOCALES, value)) language.pick(value);
          }}
        >
          <SelectTrigger {...labels}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((option) => (
              <SelectItem key={option} value={option} lang={option}>
                {LANGUAGE_NAMES[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </SettingsField>
  );
}

function DayEndField({ dayEndsAt }: { dayEndsAt: DayEndTime }) {
  const t = useTranslations('settings');
  const format = useFormatter();
  const dayEnd = useOptimisticSetting(dayEndsAt, (picked) => ({
    dayEndsAt: picked,
  }));

  return (
    <SettingsField
      label={t('dayEndsAt')}
      description={t('dayEndsAtDescription')}
    >
      {(labels) => (
        <Select
          value={dayEnd.shown}
          onValueChange={(value) => {
            const picked = DAY_END_TIMES.find((time) => time === value);
            if (picked) dayEnd.pick(picked);
          }}
        >
          <SelectTrigger {...labels}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_END_TIMES.map((time) => (
              <SelectItem key={time} value={time}>
                {format.dateTime(onTheClock(time), 'time', { timeZone: 'UTC' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </SettingsField>
  );
}

function onTheClock(time: string) {
  return new Date(`1970-01-01T${time}Z`);
}

function WeekStartField({ weekStart }: { weekStart: WeekStart }) {
  const t = useTranslations('settings');
  const start = useOptimisticSetting(weekStart, (picked) => ({
    weekStart: picked,
  }));

  return (
    <SettingsField label={t('weekStart')}>
      {(labels) => (
        <SegmentedControl {...labels} value={start.shown}>
          {WEEK_STARTS.map((option) => (
            <SegmentedControlItem
              key={option}
              value={option}
              onClick={() => {
                start.pick(option);
              }}
            >
              {t(option)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
    </SettingsField>
  );
}

function TimeFormatField({ timeFormat }: { timeFormat: TimeFormat }) {
  const t = useTranslations('settings');
  const format = useOptimisticSetting(timeFormat, (picked) => ({
    timeFormat: picked,
  }));

  return (
    <SettingsField label={t('timeFormat')}>
      {(labels) => (
        <SegmentedControl {...labels} value={format.shown}>
          {TIME_FORMATS.map((option) => (
            <SegmentedControlItem
              key={option}
              value={option}
              onClick={() => {
                format.pick(option);
              }}
            >
              {t(option)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
    </SettingsField>
  );
}
