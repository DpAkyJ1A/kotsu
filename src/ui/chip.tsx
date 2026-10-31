import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

// A short status or tag, such as a card's "Review". The colours are `palette_color` from the database
const chipVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      color: {
        neutral: 'bg-muted text-muted-foreground',
        violet: 'bg-violet text-violet-foreground',
        blue: 'bg-blue text-blue-foreground',
        amber: 'bg-amber text-amber-foreground',
        green: 'bg-green text-green-foreground',
        pink: 'bg-pink text-pink-foreground',
        orange: 'bg-orange text-orange-foreground',
        red: 'bg-red text-red-foreground',
        teal: 'bg-teal text-teal-foreground',
        slate: 'bg-slate text-slate-foreground',
      },
    },
    defaultVariants: { color: 'neutral' },
  },
);

type ChipProps = Omit<ComponentProps<'span'>, 'color'> &
  VariantProps<typeof chipVariants>;

export function Chip({ className, color, ...props }: ChipProps) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ color }), className)}
      {...props}
    />
  );
}
