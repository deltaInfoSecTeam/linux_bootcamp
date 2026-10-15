FROM node:22-slim

WORKDIR /app

# Nur package.json kopieren – Docker cacht npm install komplett!
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Anwendungscode kopieren
COPY . .

EXPOSE 8000

ENV NODE_ENV=production
ENV USE_HTTP=true
ENV PORT=8000

CMD ["node", "server.js"]
