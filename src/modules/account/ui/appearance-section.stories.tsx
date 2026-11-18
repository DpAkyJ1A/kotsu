import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, mocked, screen, waitFor } from 'storybook/test';

import { toast, Toaster } from '@/ui/toast';

import { updateSettingsAction } from '../actions';
import type { Settings } from '../core/settings';
import { AppearanceSection } from './appearance-section';

const SETTINGS: Settings = {
  theme: 'system',
  locale: 'en',
  dayEndsAt: '04:00',
  weekStart: 'monday',
  timeFormat: 'h24',
};

const WITH_AN_OPEN_SELECT = {
  a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } },
};

const meta = {
  title: 'Account/AppearanceSection',
  component: AppearanceSection,
  args: { settings: SETTINGS },
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <>
        <div className="max-w-120">
          <Story />
        </div>
        <Toaster />
      </>
    ),
  ],
  beforeEach: () => {
    mocked(updateSettingsAction).mockResolvedValue({
      ok: true,
      data: SETTINGS,
    });
    const root = document.documentElement;
    const { theme } = root.dataset;
    return () => {
      if (theme) root.dataset.theme = theme;
      toast.dismiss();
    };
  },
} satisfies Meta<typeof AppearanceSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile2' } },
};

export const InRussian: Story = {
  globals: { locale: 'ru' },
};

export const PicksATheme: Story = {
  globals: { theme: 'light' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }));

    await expect(document.documentElement).toHaveAttribute(
      'data-theme',
      'dark',
    );
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      theme: 'dark',
    });
  },
};

function holdTheSave() {
  const saving = Promise.withResolvers<undefined>();
  mocked(updateSettingsAction).mockImplementation(async () => {
    await saving.promise;
    return { ok: true, data: SETTINGS };
  });
  return () => {
    saving.resolve(undefined);
  };
}

export const PicksTheWeekStart: Story = {
  play: async ({ canvas, userEvent }) => {
    const release = holdTheSave();

    await userEvent.click(canvas.getByRole('radio', { name: 'Sunday' }));

    await expect(canvas.getByRole('radio', { name: 'Sunday' })).toBeChecked();
    await expect(updateSettingsAction).toHaveBeenCalledOnce();
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      weekStart: 'sunday',
    });
    release();
  },
};

export const PicksTheTimeFormat: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: '12 h' }));

    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      timeFormat: 'h12',
    });
  },
};

export const LeavesThePickedValueAlone: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Monday' }));

    await expect(updateSettingsAction).not.toHaveBeenCalled();
  },
};

export const PicksWhenTheDayEnds: Story = {
  parameters: WITH_AN_OPEN_SELECT,
  play: async ({ canvas, userEvent }) => {
    const release = holdTheSave();
    const dayEnd = canvas.getByRole('combobox', { name: 'Day ends at' });
    await expect(dayEnd).toHaveAccessibleDescription(
      'Ticks after midnight still count for the day before.',
    );

    await userEvent.click(dayEnd);
    await expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00']);
    await userEvent.click(screen.getByRole('option', { name: '05:00' }));

    await expect(dayEnd).toHaveTextContent('05:00');
    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      dayEndsAt: '05:00',
    });
    release();
  },
};

export const ShowsTheHoursWhateverTheTimeZone: Story = {
  parameters: WITH_AN_OPEN_SELECT,
  globals: { timeZone: 'Pacific/Kiritimati' },
  play: async ({ canvas, userEvent }) => {
    const dayEnd = canvas.getByRole('combobox', { name: 'Day ends at' });
    await expect(dayEnd).toHaveTextContent('04:00');

    await userEvent.click(dayEnd);
    await expect(screen.getAllByRole('option')[0]).toHaveTextContent('00:00');
  },
};

export const PicksALanguage: Story = {
  parameters: WITH_AN_OPEN_SELECT,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Language' }));
    await userEvent.click(screen.getByRole('option', { name: 'Русский' }));

    await expect(updateSettingsAction).toHaveBeenLastCalledWith({
      locale: 'ru',
    });
  },
};

export const GoesBackWhenSavingFails: Story = {
  beforeEach: () => {
    mocked(updateSettingsAction).mockResolvedValue({
      ok: false,
      error: { code: 'VALIDATION' },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Sunday' }));

    const failure = (
      await screen.findByText(
        "That couldn't be saved. Reload the page and try again.",
      )
    ).closest('[data-sonner-toast]');
    await waitFor(() => expect(failure).toHaveStyle({ opacity: '1' }));
    await expect(canvas.getByRole('radio', { name: 'Monday' })).toBeChecked();
  },
};
