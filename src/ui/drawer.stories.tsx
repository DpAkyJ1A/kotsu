import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, screen, waitForElementToBeRemoved } from 'storybook/test';

import { Button } from './button';
import { Chip } from './chip';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import { ClockIcon, PlayIcon, RepeatIcon } from './icons';

type EventDrawerProps = {
  defaultOpen?: boolean;
  onMarkDone: () => void;
  onStartTimer: () => void;
};

// A calendar event, as the event drawer will show it: a sheet from the bottom on a phone, a panel on the right
// on a wider screen
function EventDrawer({
  defaultOpen = false,
  onMarkDone,
  onStartTimer,
}: EventDrawerProps) {
  const [isDone, setIsDone] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Drawer defaultOpen={defaultOpen}>
        <DrawerTrigger asChild>
          <Button variant="secondary">Spanish verbs · 07:30</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <Chip color="violet">Spanish</Chip>
            <DrawerTitle>Spanish verbs</DrawerTitle>
            <DrawerDescription>
              20 cards from the verbs doc, then three sentences out loud.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex items-center gap-2">
              <ClockIcon className="text-muted-foreground" />
              07:30 – 08:00 · 30 min
            </p>
            <p className="flex items-center gap-2">
              <RepeatIcon className="text-muted-foreground" />
              Every weekday
            </p>
          </div>
          <DrawerFooter>
            <Button variant="secondary" onClick={onStartTimer}>
              <PlayIcon />
              Start 30 min timer
            </Button>
            <DrawerClose asChild>
              <Button
                onClick={() => {
                  setIsDone(true);
                  onMarkDone();
                }}
              >
                Mark done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <p role="status" className="font-semibold">
        {isDone ? 'Done today' : 'Not done yet'}
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Drawer',
  component: EventDrawer,
  args: { onMarkDone: fn(), onStartTimer: fn() },
  parameters: {
    a11y: {
      config: {
        // As with Dialog: while the drawer is open, axe sees the trigger focusable under aria-hidden
        rules: [{ id: 'aria-hidden-focus', enabled: false }],
      },
    },
  },
} satisfies Meta<typeof EventDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

// Enter opens it with the focus on the first button, Tab goes round inside, and Escape closes it, giving the
// focus back to the trigger
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Spanish verbs/ });
    const button = (name: string) => screen.getByRole('button', { name });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', {
      name: 'Spanish verbs',
    });
    await expect(drawer).toHaveAccessibleDescription(
      '20 cards from the verbs doc, then three sentences out loud.',
    );
    await expect(button('Start 30 min timer')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onStartTimer).toHaveBeenCalledOnce();
    await expect(drawer).toBeInTheDocument();

    await userEvent.tab();
    await expect(button('Mark done')).toHaveFocus();
    await userEvent.tab();
    await expect(button('Close')).toHaveFocus();
    await userEvent.tab();
    await expect(button('Start 30 min timer')).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitForElementToBeRemoved(drawer);
    await expect(trigger).toHaveFocus();
    await expect(args.onMarkDone).not.toHaveBeenCalled();
  },
};

// "Mark done" does its job and closes the drawer
export const MarkDone: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /Spanish verbs/ }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Mark done' }),
    );
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    await expect(args.onMarkDone).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('status')).toHaveTextContent('Done today');
  },
};
