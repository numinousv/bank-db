# step 1: build a production-optimized next.js app
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# the backend's public URL is baked into the JS bundle at build time.
# is set via compose: build.args.NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# step 2: minimal runtime-image
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
