FROM node:20-slim

WORKDIR /app

# install exclusively production environments
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copy the actual code for the app (no .env, injected through compose)
COPY server.js ./

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
