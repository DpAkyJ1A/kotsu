import { cn } from 'cn';

import {
  type DocFill,
  docFillOf,
  filledPercentOf,
} from '../core/save-indicator';

const FILL_TONE: Record<DocFill, string> = {
  roomy: 'bg-muted-foreground',
  filling: 'bg-muted-foreground',
  almostFull: 'bg-amber-foreground',
  overfull: 'bg-destructive',
};

type DocFillBarProps = { sizeBytes: number; className?: string };

export function DocFillBar({ sizeBytes, className }: DocFillBarProps) {
  const fill = docFillOf(sizeBytes);

  return (
    <span
      aria-hidden
      data-fill={fill}
      className={cn(
        'block h-1 overflow-hidden rounded-full bg-muted',
        className,
      )}
    >
      <span
        className={cn('block h-full rounded-full', FILL_TONE[fill])}
        style={{ width: `${String(filledPercentOf(sizeBytes))}%` }}
      />
    </span>
  );
}
