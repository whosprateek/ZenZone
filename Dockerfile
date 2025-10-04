# ---------- Build client ----------
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# ---------- Build server ----------
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .

# ---------- Runtime image ----------
FROM node:18-alpine
WORKDIR /app
# Copy server and built client
COPY --from=server-build /app/server ./server
COPY --from=client-build /app/client/build ./client/build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/server.js"]
