import { PALETTE_COLORS } from '@/lib/palette-colors';
import { ShelfDot } from '@/modules/shelves';

type TemplatePreviewProps = { id: string; shelves: readonly string[] };

export function TemplatePreview({ id, shelves }: TemplatePreviewProps) {
  return (
    <span className="grid content-start gap-1.5 p-3">
      {shelves.map((name, index) => (
        <span
          key={name}
          className="flex min-w-0 items-center gap-2 text-xs font-medium"
        >
          <ShelfDot color={PALETTE_COLORS[index] ?? 'slate'} />
          <span className="truncate">{name}</span>
        </span>
      ))}
      <span id={id} hidden>
        {shelves.join(', ')}
      </span>
    </span>
  );
}
