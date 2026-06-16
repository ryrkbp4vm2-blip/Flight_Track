# Military Flight Tracker — single-stage image.
# Builds the PWA and runs the Express server that serves it + the proxy API.
FROM node:22-slim

WORKDIR /app

# Install deps first for better layer caching. Dev deps are required: vite (web
# build) and tsx (server runtime). Do NOT set NODE_ENV=production before install.
COPY package.json package-lock.json ./
COPY web/package.json ./web/
COPY server/package.json ./server/
RUN npm ci

# Copy the rest and build the web app into web/dist.
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Hosts inject PORT; the server reads it (defaults to 3001).
EXPOSE 3001
CMD ["npm", "start"]
