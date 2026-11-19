import { appIcon } from '@/ui/app-icon';

const TAB_SIZE = 32;

export function generateImageMetadata() {
  return [TAB_SIZE, 192, 512].map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png',
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return appIcon(size, size === TAB_SIZE ? 'favicon' : 'rounded');
}
