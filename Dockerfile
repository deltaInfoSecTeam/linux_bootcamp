FROM node:22-slim

ENV NODE_ENV=production \
    PORT=8000 \
    DATA_DIR=/app/data

WORKDIR /app

# Abhängigkeiten exakt nach Lockfile installieren (reproduzierbar, gecacht)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Nur das kopieren, was zur Laufzeit gebraucht wird
COPY server ./server
COPY public ./public
COPY scripts ./scripts

# Datenverzeichnis für DB und Secrets, gehört dem unprivilegierten Nutzer
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 8000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
