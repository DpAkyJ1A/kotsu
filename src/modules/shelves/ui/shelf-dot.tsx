import { cn } from 'cn';

import type { PaletteColor } from '@/lib/palette-colors';

import { PALETTE_FILL } from './palette-fill';

type ShelfDotProps = { color: PaletteColor; className?: string };

export function ShelfDot({ color, className }: ShelfDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-2.5 shrink-0 rounded-xs',
        PALETTE_FILL[color],
        className,
      )}
    />
  );
}
