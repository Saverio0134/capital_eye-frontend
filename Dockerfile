# ── Stage 1: Build ────────────────────────────────────────────
FROM node:22.21.1-alpine AS build

WORKDIR /app

# Copia solo i file di dipendenze per sfruttare la cache dei layer
COPY package.json package-lock.json ./
RUN npm ci

# Copia il resto del sorgente
COPY . .

# Build di produzione (SSR)
RUN npm run build

# ── Stage 2: Dipendenze di produzione ─────────────────────────
# node_modules senza devDependencies: riduce superficie d'attacco e dimensione immagine
FROM node:22.21.1-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 3: Runtime ──────────────────────────────────────────
FROM node:22.21.1-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copia solo l'output della build
COPY --from=build --chown=node:node /app/dist/capital_eye-frontend ./dist/capital_eye-frontend

# L'entry SSR importa dipendenze da node_modules dentro il bundle,
# ma Express e @angular/ssr/node necessitano dei moduli a runtime.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# Esecuzione come utente non privilegiato
USER node

EXPOSE 4000

CMD ["node", "dist/capital_eye-frontend/server/server.mjs"]
