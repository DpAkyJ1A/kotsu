import { Manrope } from 'next/font/google';

// Kotsu's font. The root layout and Storybook's preview put `manrope.variable` on <html>, where theme.css
// reads it as --font-sans.
export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});
