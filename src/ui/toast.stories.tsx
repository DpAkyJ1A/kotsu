import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  expect,
  fn,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from 'storybook/test';

import { Button } from './button';
import { toast, Toaster } from './toast';

const SHELVES = ['Spanish', 'Guitar', 'Running'];

// A toast slides in for 0.4 s; once it is fully shown, axe checks its contrast too
async function findToast(text: string) {
  const shown = (await screen.findByText(text)).closest('[data-sonner-toast]');
  await waitFor(() => expect(shown).toHaveStyle({ opacity: '1' }));
}

type DeleteShelvesProps = {
  onDelete: (shelf: string) => void;
  onUndo: (shelf: string) => void;
};

// Deleting a shelf asks nothing: it goes at once, and the toast offers to bring it back
function DeleteShelves({ onDelete, onUndo }: DeleteShelvesProps) {
  const [shelves, setShelves] = useState(SHELVES);

  const remove = (shelf: string) => {
    setShelves((current) => current.filter((name) => name !== shelf));
    onDelete(shelf);
    toast.success(`Deleted “${shelf}”`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setShelves((current) =>
            SHELVES.filter((name) => name === shelf || current.includes(name)),
          );
          onUndo(shelf);
        },
      },
    });
  };

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <ul className="flex flex-col gap-1.5">
        {shelves.map((shelf) => (
          <li key={shelf} className="flex items-center gap-3">
            <span className="w-20 font-semibold">{shelf}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                remove(shelf);
              }}
            >
              Delete {shelf}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast.error('Couldn’t save the doc', {
            description: 'You’re offline. Kotsu will try again.',
          })
        }
      >
        Show an error
      </Button>
      <p role="status" className="font-semibold">
        {shelves.length} shelves
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Toast',
  component: DeleteShelves,
  args: { onDelete: fn(), onUndo: fn() },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  // A new Toaster shows every toast still open, so none is left over for the next story
  beforeEach: () => () => {
    toast.dismiss();
  },
} satisfies Meta<typeof DeleteShelves>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete Spanish' }),
    );
    await findToast('Deleted “Spanish”');
  },
};

// Undo in the toast brings the shelf back and closes the toast
export const Undo: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete Spanish' }),
    );
    await findToast('Deleted “Spanish”');
    await expect(canvas.getByRole('status')).toHaveTextContent('2 shelves');

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await expect(args.onUndo).toHaveBeenCalledOnce();
    await expect(args.onUndo).toHaveBeenLastCalledWith('Spanish');
    await expect(canvas.getByRole('status')).toHaveTextContent('3 shelves');
    await waitForElementToBeRemoved(() =>
      screen.queryByText('Deleted “Spanish”'),
    );
  },
};

// Alt+T takes the focus to the toasts, so Undo is a Tab away, without the mouse
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.tab();
    await expect(
      canvas.getByRole('button', { name: 'Delete Guitar' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await screen.findByText('Deleted “Guitar”');

    await userEvent.keyboard('{Alt>}t{/Alt}');
    await expect(document.activeElement).toHaveAttribute('data-sonner-toaster');
    await userEvent.tab();
    await userEvent.tab();
    await expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onUndo).toHaveBeenCalledOnce();
    await expect(args.onUndo).toHaveBeenLastCalledWith('Guitar');
    await expect(canvas.getByRole('status')).toHaveTextContent('3 shelves');
  },
};

export const ErrorWithDescription: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show an error' }),
    );
    await findToast('You’re offline. Kotsu will try again.');
  },
};
