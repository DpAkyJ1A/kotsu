import { appIcon } from '@/ui/app-icon';

export function generateImageMetadata() {
  return [180, 512].map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png',
  }));
}

export default async function AppleIcon({ id }: { id: Promise<string> }) {
  return appIcon(Number(await id), 'fullBleed');
}
