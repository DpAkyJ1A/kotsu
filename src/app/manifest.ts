import type { MetadataRoute } from 'next';

import { BACKGROUND } from '@/lib/theme-color';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kotsu',
    short_name: 'Kotsu',
    description: 'Open-source workspace for any goal you practise daily',
    start_url: '/calendar',
    scope: '/',
    display: 'standalone',
    background_color: BACKGROUND.light,
    theme_color: BACKGROUND.light,
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      {
        src: '/apple-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
