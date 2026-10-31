import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type SubmitEvent, useState } from 'react';
import { expect, fn, screen } from 'storybook/test';

import { Button } from './button';
import { PencilIcon } from './icons';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type RenameShelfProps = {
  defaultOpen?: boolean;
  onRename: (name: string) => void;
};

// Renaming a shelf in place: Enter saves, Escape or a click outside leaves the name as it was
function RenameShelf({ defaultOpen = false, onRename }: RenameShelfProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [name, setName] = useState('Spanish');

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newName = new FormData(event.currentTarget).get('name');
    if (typeof newName !== 'string') return;
    setName(newName);
    onRename(newName);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="secondary">
            <PencilIcon />
            Rename shelf
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" aria-labelledby="rename-title">
          <form onSubmit={save} className="flex flex-col gap-3">
            <h2 id="rename-title" className="font-bold">
              Rename shelf
            </h2>
            <Input name="name" aria-label="Name" defaultValue={name} required />
            <Button type="submit" size="sm" className="self-end">
              Save
            </Button>
          </form>
        </PopoverContent>
      </Popover>
      <p role="status" className="font-semibold">
        Shelf: {name}
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Popover',
  component: RenameShelf,
  args: { onRename: fn() },
} satisfies Meta<typeof RenameShelf>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

// Enter on the trigger opens it with the focus in the field, Enter in the field saves and closes it, and the
// focus goes back to the trigger
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Rename shelf' });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const field = await screen.findByRole('textbox', { name: 'Name' });
    await expect(screen.getByRole('dialog')).toHaveAccessibleName(
      'Rename shelf',
    );
    await expect(field).toHaveFocus();

    await userEvent.clear(field);
    await userEvent.type(field, 'Spanish B1{Enter}');
    await expect(args.onRename).toHaveBeenCalledOnce();
    await expect(args.onRename).toHaveBeenLastCalledWith('Spanish B1');
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Shelf: Spanish B1',
    );
  },
};

// Escape and a click outside both close it without saving; Escape gives the focus back to the trigger
export const Dismiss: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Rename shelf' });

    await userEvent.click(trigger);
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' verbs',
    );
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.click(canvas.getByRole('status'));
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(args.onRename).not.toHaveBeenCalled();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Shelf: Spanish',
    );
  },
};
