import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, screen, waitForElementToBeRemoved } from 'storybook/test';

import { Button } from './button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

type Choice = 'stop' | 'delete';

type DeleteEventProps = {
  defaultOpen?: boolean;
  onChoose: (choice: Choice) => void;
};

const OUTCOME: Record<Choice, string> = {
  stop: 'Stopped repeating; its 24 days stay in the heatmap',
  delete: 'Deleted with its 24 days',
};

// Deleting a habit that has ticks, as the calendar will ask it: the safe choice is the main one, and the focus
// starts on Cancel, the least destructive button
function DeleteEvent({ defaultOpen = false, onChoose }: DeleteEventProps) {
  const [outcome, setOutcome] = useState('In the calendar');

  const choose = (choice: Choice) => {
    setOutcome(OUTCOME[choice]);
    onChoose(choice);
  };

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Dialog defaultOpen={defaultOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete “Spanish verbs”</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “Spanish verbs”?</DialogTitle>
            <DialogDescription>
              You ticked it off on 24 days. Stop repeating takes it off the
              calendar and keeps those days in your heatmap and stats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  choose('delete');
                }}
              >
                Delete with history
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  choose('stop');
                }}
              >
                Stop repeating
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p role="status" className="font-semibold">
        {outcome}
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Dialog',
  component: DeleteEvent,
  args: { onChoose: fn() },
  parameters: {
    a11y: {
      config: {
        // While a dialog is open Radix hides the rest of the page from screen readers and keeps the focus
        // inside, so the trigger can't be reached; axe only sees a focusable button under aria-hidden
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof DeleteEvent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

// The focus starts on Cancel, Tab and Shift+Tab go round the dialog without leaving it, and Escape closes it
// without a choice, giving the focus back to the trigger
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Delete/ });
    const button = (name: string) => screen.getByRole('button', { name });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', {
      name: 'Delete “Spanish verbs”?',
    });
    await expect(button('Cancel')).toHaveFocus();

    await userEvent.tab();
    await expect(button('Delete with history')).toHaveFocus();
    await userEvent.tab();
    await expect(button('Stop repeating')).toHaveFocus();
    await userEvent.tab();
    await expect(button('Close')).toHaveFocus();
    await userEvent.tab();
    await expect(button('Cancel')).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(button('Close')).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitForElementToBeRemoved(dialog);
    await expect(trigger).toHaveFocus();
    await expect(args.onChoose).not.toHaveBeenCalled();
  },
};

// The kit's own words come in the user's language, here from the toolbar's language switch; the story's text is
// sample data and stays English
export const InRussian: Story = {
  args: { defaultOpen: true },
  globals: { locale: 'ru' },
  play: async () => {
    await expect(
      await screen.findByRole('button', { name: 'Закрыть' }),
    ).toBeInTheDocument();
    await expect(document.documentElement).toHaveAttribute('lang', 'ru');
  },
};

// A button makes the choice and closes the dialog; a click on the overlay closes it without one
export const Pointer: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Delete/ });

    await userEvent.click(trigger);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Stop repeating' }),
    );
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    await expect(args.onChoose).toHaveBeenCalledOnce();
    await expect(args.onChoose).toHaveBeenLastCalledWith('stop');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Stopped repeating',
    );

    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    // The overlay has no role to find it by
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    await expect(overlay).toBeInTheDocument();
    if (overlay) await userEvent.click(overlay);
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    await expect(args.onChoose).toHaveBeenCalledOnce();
  },
};
