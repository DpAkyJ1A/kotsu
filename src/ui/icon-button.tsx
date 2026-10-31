import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import type { ComponentProps, ReactElement } from 'react';

import { buttonVariants } from './button';

// Square, and the icon (1em) a step bigger than the text of a button of the same size
const iconButtonVariants = cva('px-0', {
  variants: {
    size: {
      sm: 'size-8 text-sm',
      md: 'size-9 text-base',
      lg: 'size-11 text-xl',
    },
  },
  defaultVariants: { size: 'md' },
});

type IconButtonProps = Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label'
> &
  VariantProps<typeof buttonVariants> & {
    // The accessible name, required: an icon alone tells a screen reader nothing
    label: string;
    children: ReactElement;
  };

export function IconButton({
  className,
  variant = 'ghost',
  size,
  label,
  ...props
}: IconButtonProps) {
  return (
    <button
      data-slot="icon-button"
      aria-label={label}
      className={cn(
        buttonVariants({ variant, size }),
        iconButtonVariants({ size }),
        className,
      )}
      {...props}
    />
  );
}
