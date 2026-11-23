import { Kbd } from '@/ui/kbd';
import { isApplePlatform, shortcutKeys } from '@/ui/shortcut';

export function PlatformKeys({ binding }: { binding: string }) {
  const isApple = isApplePlatform(navigator.userAgent);
  return <Kbd>{shortcutKeys(binding, { isApple })}</Kbd>;
}
