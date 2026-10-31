import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  // Vite rather than webpack, because the Vitest addon runs the stories through Vite
  framework: '@storybook/nextjs-vite',
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  // The theme paints the background, so Storybook's own background switch would only fight it
  features: { backgrounds: false },
  core: { disableTelemetry: true },
};

export default config;
