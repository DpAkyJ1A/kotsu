import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useEffectEvent, useState } from 'react';
import { expect, fn, screen } from 'storybook/test';

import { IconButton } from './icon-button';
import { PanelLeftIcon } from './icons';
import { Kbd } from './kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

type SidebarToggleProps = {
  defaultOpen?: boolean;
  onToggle: (isShown: boolean) => void;
};

// A sidebar toggle as the app will have it, so the shortcut in the tooltip works here too. The tooltip only
// shows the hint; the shortcut belongs to whoever owns the action
function SidebarToggle({ defaultOpen = false, onToggle }: SidebarToggleProps) {
  const [isShown, setIsShown] = useState(true);

  const toggle = () => {
    setIsShown(!isShown);
    onToggle(!isShown);
  };
  const handleShortcut = useEffectEvent(toggle);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // By key position, so it works in any keyboard layout
      if (event.code === 'Backslash' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleShortcut();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Tooltip defaultOpen={defaultOpen}>
        <TooltipTrigger asChild>
          <IconButton label="Toggle sidebar" onClick={toggle}>
            <PanelLeftIcon />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          Toggle sidebar <Kbd>⌘\</Kbd>
        </TooltipContent>
      </Tooltip>
      <p role="status" className="font-semibold">
        Sidebar {isShown ? 'shown' : 'hidden'}
      </p>
      <p className="max-w-sm text-muted-foreground">
        Hover the button or Tab to it for the tooltip, Esc hides it. A click,
        Enter or ⌘\ toggles the sidebar; each toggle shows in the Actions panel.
      </p>
    </div>
  );
}

const meta = {
  title: 'Components/Tooltip',
  component: SidebarToggle,
  args: { onToggle: fn() },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof SidebarToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
};

// The pointer opens it after a short delay and leaving closes it
export const Hover: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Toggle sidebar' });

    await userEvent.hover(trigger);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Toggle sidebar ⌘\\',
    );

    await userEvent.unhover(trigger);
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};

// Focus opens it at once and the trigger points to it; Escape closes it and leaves the focus on the trigger,
// whose own keys and shortcut still work
export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Toggle sidebar' });

    await userEvent.tab();
    await expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await expect(trigger).toHaveAccessibleDescription('Toggle sidebar ⌘\\');

    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onToggle).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard('{Meta>}[Backslash]{/Meta}');
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('status')).toHaveTextContent('Sidebar shown');
  },
};
