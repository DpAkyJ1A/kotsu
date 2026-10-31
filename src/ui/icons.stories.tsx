import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import * as icons from './icons';

// Built from the module, so an icon added to icons.ts shows up here by itself
const ICONS = Object.entries(icons).map(([name, Icon]) => ({
  name: name.replace(/Icon$/, ''),
  Icon,
}));

function IconGallery() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {ICONS.map(({ name, Icon }) => (
        <li key={name} className="flex min-w-0 items-center gap-2">
          <Icon className="size-5" />
          <span className="truncate text-sm">{name}</span>
        </li>
      ))}
    </ul>
  );
}

const meta = {
  title: 'Foundations/Icons',
  component: IconGallery,
} satisfies Meta<typeof IconGallery>;

export default meta;

export const Icons: StoryObj<typeof meta> = {};
