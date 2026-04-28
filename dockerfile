FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
ENV NUXT_DATABASE_URL="postgresql://x:x@x:5432/x"
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/.output ./.output
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Container readiness probe — Docker / Compose / orchestrators can wait
# for `healthy` before routing traffic.
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
