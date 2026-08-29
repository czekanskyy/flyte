# Next.js standalone image for flyte-web. Secrets stay out of the image.
FROM node:24-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apk add --no-cache libc6-compat python3 make g++ \
  && corepack enable \
  && corepack prepare pnpm@11.24.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter web build

FROM node:24-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN apk add --no-cache wget \
  && addgroup -S -g 1001 nodejs \
  && adduser -S -u 1001 -G nodejs flyte
COPY --from=builder --chown=flyte:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=flyte:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=flyte:nodejs /app/apps/web/public ./apps/web/public
USER flyte
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"ok":true'
CMD ["node", "apps/web/server.js"]
