# Placeholder until print exists. Playwright replaces this image in a later phase.
FROM node:24-alpine
WORKDIR /app
COPY server.mjs ./server.mjs
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs flyte
USER flyte
ENV PORT=3001
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
