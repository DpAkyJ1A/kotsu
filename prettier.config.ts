import type { Config } from 'prettier';
import type { PluginOptions } from 'prettier-plugin-tailwindcss';

const config: Config & PluginOptions = {
  singleQuote: true,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/globals.css',
  // Sort the classes inside these calls too, not only in className
  tailwindFunctions: ['cn', 'cva'],
};

export default config;
