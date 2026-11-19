import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // The Docker image runs Next.js's own minimal server; `next start` warns about this output, so only the image asks for it
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
  reactCompiler: true,
  typedRoutes: true,
  redirects: () =>
    Promise.resolve([
      { source: '/', destination: '/calendar', permanent: false },
    ]),
};

// Finds the request config in src/i18n/request.ts
const withNextIntl = createNextIntlPlugin({
  experimental: {
    // Writes messages/en.d.json.ts on `next dev`, `next build` and `next typegen`, so a message's arguments are
    // typed too: `t('cardsLeft')` without its `count` fails the typecheck
    createMessagesDeclaration: './messages/en.json',
  },
});

export default withNextIntl(nextConfig);
