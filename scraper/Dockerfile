# Hirin scraper service — deploys to Railway.
# Uses the official Playwright image so Chromium + system deps are pre-installed.
FROM mcr.microsoft.com/playwright:v1.58.1-jammy

WORKDIR /app

# Cache deps separately from app code
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# Compile TypeScript at build time (devDeps needed for tsc)
COPY tsconfig.json ./
COPY src ./src
RUN npm install --include=dev --ignore-scripts \
    && npx tsc \
    && npm prune --omit=dev

# Railway sets PORT for us; default to 3001 locally.
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]
