import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  'grid shrink-0 place-items-center rounded-full bg-violet font-semibold text-violet-foreground',
  {
    variants: {
      size: {
        md: 'size-6 text-xs',
        lg: 'size-9 text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type AvatarProps = VariantProps<typeof avatarVariants> & { name: string };

export function Avatar({ name, size }: AvatarProps) {
  return (
    <span aria-hidden className={avatarVariants({ size })}>
      {Array.from(name)[0]?.toUpperCase()}
    </span>
  );
}
