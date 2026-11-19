# syntax=docker/dockerfile:1

FROM node:26-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global "$(node --print "require('./package.json').packageManager")"
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store
COPY . .
# `next build` loads the route modules, and they check the environment; nothing in the build connects to the database
RUN DATABASE_URL=postgres://build@localhost/build \
    BETTER_AUTH_SECRET=build-only-secret-that-signs-nothing \
    NEXT_OUTPUT=standalone \
    pnpm build
# The server bundles its own copy of Drizzle, but migrate.ts runs outside it
RUN cp -RL node_modules/drizzle-orm .next/standalone/node_modules/drizzle-orm

FROM base
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
# Owned by the server's user, so it can write its cache into .next
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/migrate.ts ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "--eval", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
